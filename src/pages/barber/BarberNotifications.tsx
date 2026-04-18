import DashboardLayout from "@/components/DashboardLayout";
import NotificationCenter from "@/components/notifications/NotificationCenter";

const BarberNotifications = () => {
  return (
    <DashboardLayout userType="barbeiro">
      <NotificationCenter role="barbeiro" />
    </DashboardLayout>
  );
};

export default BarberNotifications;

