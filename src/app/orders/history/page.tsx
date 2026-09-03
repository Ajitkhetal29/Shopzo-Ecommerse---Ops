"use client";

import OpsOrderList from "../OpsOrderList";

export default function OpsOrderHistoryPage() {
  return (
    <OpsOrderList
      scope="history"
      title="Order history"
      subtitle="Delivered and cancelled orders"
    />
  );
}
