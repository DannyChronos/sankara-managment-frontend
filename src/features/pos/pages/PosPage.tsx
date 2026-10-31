import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { App, Button, Flex, Input, Modal, Typography } from 'antd';
import type { InputRef } from 'antd';
import { Money, PdfButton } from '../../../shared/components';
import { errorMessage, toApiError } from '../../../shared/api/errors';
import { useAuth } from '../../../shared/auth/useAuth';
import { useBarcodeScanner } from '../../../shared/hooks/useBarcodeScanner';
import { useCurrentSession } from '../../cash-sessions/hooks';
import { usePosFiscalContext } from '../../fiscal/hooks';
import { useSaleEinvoice } from '../../sales/hooks';
import type { Customer, SalePayment } from '../../../shared/api/types';
import { posApi } from '../api';
import { buildSalePayload } from '../sale-payload';
import { useCreateSale, useVariantSearch } from '../hooks';
import {
  cartDiscount,
  cartSubtotal,
  cartTotal,
  useCartStore,
} from '../store/cart.store';
import { OpenSessionCard } from '../components/OpenSessionCard';
import { VariantGrid } from '../components/VariantGrid';
import { CartPanel } from '../components/CartPanel';
import { PaymentModal } from '../components/PaymentModal';
import { CustomerModal } from '../components/CustomerModal';
import { EinvoiceWaitModal } from '../components/EinvoiceWaitModal';

export function PosPage() {
  const { message } = App.useApp();
  const { user, currentSite } = useAuth();
  const session = useCurrentSession();

  const [term, setTerm] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  // Le ticket se rouvre après coup : la dernière vente vit dans le panier
  // persistant, elle survit donc aussi à un rechargement.
  const [receiptOpen, setReceiptOpen] = useState(false);
  // Vente dont on attend la facture : la fenêtre d'attente lui est propre et
  // ne doit pas se rouvrir sur un simple rendu.
  const [waitingFor, setWaitingFor] = useState<string | null>(null);
  const [waitDeadlinePassed, setWaitDeadlinePassed] = useState(false);
  const searchRef = useRef<InputRef>(null);

  const cart = useCartStore();
  const lastSale = cart.lastSale;
  const search = useVariantSearch(term);
  const createSale = useCreateSale();

  const fiscal = usePosFiscalContext();
  const invoiceMode = fiscal.data?.invoiceMode ?? 'DISABLED';
  const emecefEnv = fiscal.data?.env ?? 'TEST';
  // Interrogation rapide tant que le caissier attend ; dès qu'il a pris le
  // reçu provisoire, on repasse au rythme lent.
  const einvoice = useSaleEinvoice(
    waitingFor ?? undefined,
    Boolean(waitingFor) && !waitDeadlinePassed,
  );

  const lines = cart.lines;
  const total = cartTotal(lines);

  /** Le scan ajoute directement l'article : le caissier n'a rien à cliquer. */
  const onScan = useCallback(
    (code: string) => {
      void posApi
        .search(code)
        .then((results) => {
          const exact =
            results.find((variant) => variant.barcode === code) ??
            results.find((variant) => variant.sku === code);

          if (!exact) {
            message.warning(`Aucun article pour le code ${code}.`);
            return;
          }
          if (exact.available <= 0) {
            message.warning(`${exact.productName} est en rupture sur ce site.`);
            return;
          }
          cart.add(exact);
        })
        .catch((error: unknown) => message.error(errorMessage(error)));
    },
    [cart, message],
  );

  useBarcodeScanner(onScan);

  /**
   * Dix secondes, pas plus (§6.4) : au-delà, la caisse propose un reçu
   * provisoire. Faire patienter un client devant une file parce qu'une
   * administration est lente n'est pas une option.
   */
  useEffect(() => {
    if (!waitingFor || waitDeadlinePassed) return;

    const timer = setTimeout(() => setWaitDeadlinePassed(true), 10_000);
    return () => clearTimeout(timer);
  }, [waitingFor, waitDeadlinePassed]);

  // Raccourcis clavier du comptoir (FRONTEND.md §9.3).
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'F2') {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === 'F4') {
        event.preventDefault();
        setCustomerOpen(true);
      }
      // F6 : facture normalisée, en mode « à la demande » seulement — en
      // mode systématique il n'y a rien à basculer.
      if (event.key === 'F6' && invoiceMode === 'ON_DEMAND') {
        event.preventDefault();
        cart.setInvoiceRequested(!cart.invoiceRequested);
      }
      if (event.key === 'F9' && lines.length > 0) {
        event.preventDefault();
        setPaymentOpen(true);
      }
      if (event.key === 'Delete' && event.ctrlKey && lines.length > 0) {
        event.preventDefault();
        Modal.confirm({
          title: 'Vider le panier ?',
          okText: 'Vider',
          cancelText: 'Annuler',
          okButtonProps: { danger: true },
          onOk: () => cart.clear(),
        });
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cart, lines.length, invoiceMode]);

  if (session.isPending) return null;

  if (session.isError) {
    const apiError = toApiError(session.error);
    if (apiError.code === 'NO_OPEN_SESSION') {
      return (
        <>
          <PosHeader cashier={user?.fullName} site={currentSite?.name} />
          <OpenSessionCard />
        </>
      );
    }
    return (
      <Flex align="center" justify="center" style={{ flex: 1 }}>
        <Typography.Text type="danger">
          {errorMessage(session.error)}
        </Typography.Text>
      </Flex>
    );
  }

  const submit = (payments: SalePayment[]) => {
    const idempotencyKey = cart.startAttempt();

    createSale.mutate(
      {
        payload: buildSalePayload({
          lines,
          payments,
          customerId: cart.customerId,
          mode: invoiceMode,
          invoiceRequested: cart.invoiceRequested,
          buyer: cart.buyer,
        }),
        idempotencyKey,
      },
      {
        onSuccess: (order) => {
          setPaymentOpen(false);
          setFailure(null);
          cart.setLastSale(order);

          // Le panier est vidé avant la réponse de la DGI : le caissier peut
          // commencer la vente suivante pendant que la facture se fabrique.
          if (order.einvoiceStatus === 'PENDING') {
            setWaitingFor(order.id);
            setWaitDeadlinePassed(false);
          } else {
            setReceiptOpen(true);
          }

          cart.clear();
          setTerm('');
          searchRef.current?.focus();
        },
        onError: (error) => {
          const apiError = toApiError(error);
          // Une erreur métier se corrige dans le panier ; une coupure réseau
          // se relance telle quelle, avec la même clé.
          if (apiError.status === 0) {
            setFailure(apiError.message);
          } else {
            setPaymentOpen(false);
            message.error(errorMessage(error));
          }
        },
      },
    );
  };

  return (
    <>
      <PosHeader
        cashier={user?.fullName}
        site={currentSite?.name}
        sessionNumber={session.data.number}
        lastSaleNumber={lastSale?.number}
        onReopenReceipt={() => setReceiptOpen(true)}
      />

      <Flex style={{ flex: 1, minHeight: 0 }}>
        <Flex vertical style={{ flex: 1, padding: 16, minWidth: 0 }}>
          <Input.Search
            ref={searchRef}
            autoFocus
            size="large"
            allowClear
            placeholder="Rechercher (nom, SKU, code-barres) · F2"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
          />

          <div style={{ flex: 1, overflowY: 'auto', marginTop: 16 }}>
            <VariantGrid
              results={search.data ?? []}
              loading={search.isFetching}
              term={term}
              onPick={(variant) => cart.add(variant)}
            />
          </div>
        </Flex>

        <div
          style={{
            width: 380,
            borderLeft: '1px solid #e8eef5',
            padding: 16,
            background: '#fff',
          }}
        >
          <CartPanel
            lines={lines}
            subtotal={cartSubtotal(lines)}
            discount={cartDiscount(lines)}
            total={total}
            customerLabel={cart.customerLabel}
            invoiceMode={invoiceMode}
            emecefEnv={emecefEnv}
            invoiceRequested={cart.invoiceRequested}
            buyer={cart.buyer}
            onInvoiceRequestedChange={cart.setInvoiceRequested}
            onBuyerChange={cart.setBuyer}
            onQuantity={cart.setQuantity}
            onDiscount={cart.setDiscount}
            onRemove={cart.remove}
            onPickCustomer={() => setCustomerOpen(true)}
            onCheckout={() => setPaymentOpen(true)}
          />
        </div>
      </Flex>

      <PaymentModal
        key={paymentOpen ? 'payment-open' : 'payment-closed'}
        open={paymentOpen}
        total={total}
        pending={createSale.isPending}
        failure={failure}
        invoiceNotice={invoiceNotice(
          invoiceMode,
          cart.invoiceRequested,
          cart.buyer.name,
        )}
        onCancel={() => {
          setPaymentOpen(false);
          setFailure(null);
        }}
        onSubmit={submit}
      />

      <CustomerModal
        open={customerOpen}
        onCancel={() => setCustomerOpen(false)}
        onPick={(customer: Customer | null) => {
          // Un client entreprise préremplit l'acheteur de la facture : sa
          // raison sociale et son IFU sont déjà connus (§6.2). Les champs
          // restent modifiables pour cette vente.
          cart.setCustomer(
            customer?.id ?? null,
            customer?.fullName ?? null,
            customer
              ? {
                  ...(customer.companyName || customer.fullName
                    ? { name: customer.companyName ?? customer.fullName }
                    : {}),
                  ...(customer.ifu ? { ifu: customer.ifu } : {}),
                }
              : {},
          );
          setCustomerOpen(false);
        }}
      />

      {lastSale && waitingFor === lastSale.id && (
        <EinvoiceWaitModal
          open
          sale={lastSale}
          einvoice={einvoice.data}
          timedOut={waitDeadlinePassed}
          onWaitMore={() => {
            setWaitDeadlinePassed(false);
            void einvoice.refetch();
          }}
          onClose={() => {
            setWaitingFor(null);
            setWaitDeadlinePassed(false);
            searchRef.current?.focus();
          }}
        />
      )}

      <Modal
        open={receiptOpen && Boolean(lastSale)}
        onCancel={() => setReceiptOpen(false)}
        title={`Vente ${lastSale?.number ?? ''}`}
        footer={
          <Flex gap={8} justify="end">
            <PdfButton
              path={`/sales/${lastSale?.id ?? ''}/receipt`}
              fileName={`${lastSale?.number ?? 'ticket'}.pdf`}
              print
            >
              Imprimer le ticket
            </PdfButton>
            <Button type="primary" onClick={() => setReceiptOpen(false)}>
              Vente suivante
            </Button>
          </Flex>
        }
      >
        <Typography.Title level={3} style={{ marginTop: 0 }}>
          <Money value={lastSale?.total ?? 0} strong />
        </Typography.Title>
        {lastSale?.payments
          .filter((payment) => payment.changeGiven)
          .map((payment) => (
            <Typography.Text
              key={payment.id}
              type="success"
              style={{ fontSize: 18 }}
            >
              Rendu : <Money value={payment.changeGiven ?? 0} strong />
            </Typography.Text>
          ))}
      </Modal>
    </>
  );
}

/** Ce que la fenêtre d'encaissement rappelle au caissier (§6.3). */
function invoiceNotice(
  mode: string,
  requested: boolean,
  buyerName?: string,
): string | null {
  const invoiced = mode === 'ALWAYS' || (mode === 'ON_DEMAND' && requested);
  if (!invoiced) return null;
  return buyerName?.trim()
    ? `Facture normalisée · ${buyerName.trim()}`
    : 'Facture normalisée';
}

function PosHeader({
  cashier,
  site,
  sessionNumber,
  lastSaleNumber,
  onReopenReceipt,
}: {
  cashier?: string;
  site?: string;
  sessionNumber?: string;
  lastSaleNumber?: string;
  onReopenReceipt?: () => void;
}) {
  return (
    <Flex
      align="center"
      justify="space-between"
      style={{
        padding: '10px 16px',
        background: 'var(--sankara-navy)',
        color: '#fff',
      }}
      className="no-print"
    >
      <Typography.Text strong style={{ color: '#fff' }}>
        Matelas Sankara · {site ?? '—'}
        {sessionNumber ? ` · ${sessionNumber}` : ''} · {cashier ?? ''}
      </Typography.Text>
      <Flex gap={8}>
        {lastSaleNumber && (
          <Button size="small" onClick={onReopenReceipt}>
            Dernier ticket · {lastSaleNumber}
          </Button>
        )}
        <Link to="/cash-sessions/me">
          <Button size="small">Ma caisse</Button>
        </Link>
        <Link to="/dashboard">
          <Button size="small">Quitter</Button>
        </Link>
      </Flex>
    </Flex>
  );
}

export default PosPage;
