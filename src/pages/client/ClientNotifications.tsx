import DashboardLayout from "@/components/DashboardLayout";
import NotificationCenter from "@/components/notifications/NotificationCenter";

const ClientNotifications = () => {
  return (
    <DashboardLayout userType="cliente">
      <NotificationCenter role="cliente" />
    </DashboardLayout>
  );
};

export default ClientNotifications;

