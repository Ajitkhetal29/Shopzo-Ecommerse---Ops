"use client";

import OpsOrderList from "./OpsOrderList";

export default function OpsOrdersPage() {
  return (
    <OpsOrderList
      scope="open"
      title="Orders"
      subtitle="Open buyer orders and fulfillment status"
    />
  );
}
