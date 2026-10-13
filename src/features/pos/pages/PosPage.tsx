import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { App, Button, Flex, Input, Modal, Typography } from 'antd';
import type { InputRef } from 'antd';
import { Money, PdfButton } from '../../../shared/components';
import { errorMessage, toApiError } from '../../../shared/api/errors';
import { useAuth } from '../../../shared/auth/useAuth';
import { useBarcodeScanner } from '../../../shared/hooks/useBarcodeScanner';
import { useCurrentSession } from '../../cash-sessions/hooks';
import type { Customer, Order, SalePayment } from '../../../shared/api/types';
import { posApi } from '../api';
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

export function PosPage() {
  const { message } = App.useApp();
  const { user, currentSite } = useAuth();
  const session = useCurrentSession();

  const [term, setTerm] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [lastSale, setLastSale] = useState<Order | null>(null);
  const searchRef = useRef<InputRef>(null);

  const cart = useCartStore();
  const search = useVariantSearch(term);
  const createSale = useCreateSale();

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
  }, [cart, lines.length]);

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
        payload: {
          lines: lines.map((line) => ({
            variantId: line.variantId,
            quantity: line.quantity,
            ...(line.discount > 0 ? { discount: line.discount } : {}),
          })),
          payments,
          ...(cart.customerId ? { customerId: cart.customerId } : {}),
        },
        idempotencyKey,
      },
      {
        onSuccess: (order) => {
          setPaymentOpen(false);
          setFailure(null);
          setLastSale(order);
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
          cart.setCustomer(customer?.id ?? null, customer?.fullName ?? null);
          setCustomerOpen(false);
        }}
      />

      <Modal
        open={Boolean(lastSale)}
        onCancel={() => setLastSale(null)}
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
            <Button type="primary" onClick={() => setLastSale(null)}>
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

function PosHeader({
  cashier,
  site,
  sessionNumber,
}: {
  cashier?: string;
  site?: string;
  sessionNumber?: string;
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
