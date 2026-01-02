import OrderDetailClient from "./OrderDetailClient";

export default async function OrderDetailPage({
  params,
}: {
  params: { orderId: string };
}) {
  const { orderId } = params;
  return <OrderDetailClient orderId={orderId} />;
}
