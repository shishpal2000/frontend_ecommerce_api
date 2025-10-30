import { toast } from "react-toastify";

interface ToastProps {
  type: "success" | "error" | "info" | "warning";
  message: string;
}

export const showToast = ({ type, message }: ToastProps) => {
  switch (type) {
    case "success":
      toast.success(message);
      break;
    case "error":
      toast.error(message);
      break;
    case "info":
      toast.info(message);
      break;
    case "warning":
      toast.warning(message);
      break;
    default:
      toast(message);
  }
};


