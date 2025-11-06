import { CheckoutSheet } from "@/components/customer/shared/CheckoutSheet";

interface CheckoutCoordinatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutCoordinator = ({ isOpen, onClose }: CheckoutCoordinatorProps) => {

  return <CheckoutSheet isOpen={isOpen} onClose={onClose} />;
};

