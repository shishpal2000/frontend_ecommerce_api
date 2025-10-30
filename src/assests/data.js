import { title } from "process";

export const getUserRole = () => {
  try {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("authUser");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        return user?.role || null;
      }
    }
    return null;
  } catch (error) {
    console.error("Error parsing user data:", error);
    return null;
  }
};

const sidebarLinksConfig = {
  ADMIN: [
    {
      title: "Dashboard",
      path: "/admin/dashboard",
      target: "_blank",
      rel: "noopener noreferrer",
    },
    {
      title: "MSR Styles",
      path: "/development",
      target: "_blank",
      rel: "noopener noreferrer",
    },

    {
      title: "Settings",

      list: [
        {
          title: "Users",
          path: "/admin/users",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        {
          title: "Template Management",
          path: "/specs-template",
          target: "_blank",
          rel: "noopener noreferrer",
        },

        {
          title: "Material Category Management",
          path: "/Materialtype",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        {
          title: "Process Management",
          path: "/processes",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        {
          title: "Placement location",
          path: "/placement-location",
          target: "_blank",
          rel: "noopener noreferrer",
        },

        {
          title: "Master ji Management Section",
          path: "/type_management",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      ],
    },
  ],
  MASTER_JI: [
    {
      title: "Dashboard",
      path: "/master_ji/dashboard",
      target: "_blank",
      rel: "noopener noreferrer",
    },
    {
      title: "MSR Styles",
      path: "/development",
      target: "_blank",
      rel: "noopener noreferrer",
    },

    {
      title: "Settings",
      list: [
        {
          title: "Template Management",
          path: "/specs-template",
          target: "_blank",
          rel: "noopener noreferrer",
        },

        {
          title: "Material Category Management",
          path: "/Materialtype",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        {
          title: "Process Management",
          path: "/processes",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        {
          title: "Placement location",
          path: "/placement-location",
          target: "_blank",
          rel: "noopener noreferrer",
        },

        {
          title: "Master ji Management Section",
          path: "/type_management",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      ],
    },
  ],

  MERCHANT: [
    {
      title: "Dashboard",
      path: "/merchant/dashboard",
      target: "_blank",
      rel: "noopener noreferrer",
    },
    {
      title: "MSR Styles",
      path: "/development",
      target: "_blank",
      rel: "noopener noreferrer",
    },

    {
      title: "Settings",
      list: [
        {
          title: "Template Management",
          path: "/specs-template",
          target: "_blank",
          rel: "noopener noreferrer",
        },

        {
          title: "Material Category Management",
          path: "/Materialtype",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        {
          title: "Process Management",
          path: "/processes",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        {
          title: "Master ji Management Section",
          path: "/type_management",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      ],
    },
  ],

  SAMPLING_MANAGER: [
    {
      title: "Dashboard",
      path: "/sampling_manager/dashboard",
      target: "_blank",
      rel: "noopener noreferrer",
    },
    {
      title: "MSR Styles",
      path: "/development",
      target: "_blank",
      rel: "noopener noreferrer",
    },
    {
      title: "Settings",
      list: [
        {
          title: "Template Management",
          path: "/specs-template",
          target: "_blank",
          rel: "noopener noreferrer",
        },

        {
          title: "Material Category Management",
          path: "/Materialtype",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        {
          title: "Process Management",
          path: "/processes",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        {
          title: "Master ji Management Section",
          path: "/type_management",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      ],
    },
  ],

  ASSISTANT_MERCHANT: [
    {
      title: "Dashboard",
      path: "/assistant_merchant/dashboard",
      target: "_blank",
      rel: "noopener noreferrer",
    },
    {
      title: "MSR Styles",
      path: "/development",
      target: "_blank",
      rel: "noopener noreferrer",
    },

    {
      title: "Settings",

      list: [
        {
          title: "Template Management",
          path: "/specs-template",
          target: "_blank",
          rel: "noopener noreferrer",
        },

        {
          title: "Material Category Management",
          path: "/Materialtype",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        {
          title: "Process Management",
          path: "/processes",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        {
          title: "Master ji Management Section",
          path: "/type_management",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      ],
    },
  ],

  GARMENT_TECHNICIAN: [
    {
      title: "Dashboard",
      path: "/garment_technician/dashboard",
      target: "_blank",
      rel: "noopener noreferrer",
    },
    {
      title: "MSR Styles",
      path: "/development",
      target: "_blank",
      rel: "noopener noreferrer",
    },
    {
      title: "settings",
      list: [
        {
          title: "Template Management",
          path: "/specs-template",
          target: "_blank",
          rel: "noopener noreferrer",
        },

        {
          title: "Material Category Management",
          path: "/Materialtype",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        {
          title: "Process Management",
          path: "/processes",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        {
          title: "Master ji Management Section",
          path: "/type_management",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      ],
    },
  ],

  GARMENT_TECHNICIAN_ASSISTANT: [
    {
      title: "Dashboard",
      path: "/garment_technician_assistant/dashboard",
      target: "_blank",
      rel: "noopener noreferrer",
    },
    {
      title: "MSR Styles",
      path: "/development",
      target: "_blank",
      rel: "noopener noreferrer",
    },
    {
      title: "settings",
      list: [
        {
          title: "Template Management",
          path: "/specs-template",
          target: "_blank",
          rel: "noopener noreferrer",
        },

        {
          title: "Material Category Management",
          path: "/Materialtype",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        {
          title: "Process Management",
          path: "/processes",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        {
          title: "Master ji Management Section",
          path: "/type_management",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      ],
    },
  ],

  TAILOR: [
    {
      title: "Dashboard",
      path: "/tailor/dashboard",
      target: "_blank",
      rel: "noopener noreferrer",
    },
    {
      title: "MSR Styles",
      path: "/development",
      target: "_blank",
      rel: "noopener noreferrer",
    },
    {
      title: "settings",
      list: [
        {
          title: "Template Management",
          path: "/specs-template",
          target: "_blank",
          rel: "noopener noreferrer",
        },

        {
          title: "Material Category Management",
          path: "/Materialtype",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        {
          title: "Process Management",
          path: "/processes",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        {
          title: "Master ji Management Section",
          path: "/type_management",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      ],
    },
  ],

  HOD: [
    {
      title: "Dashboard",
      path: "/hod/dashboard",
      target: "_blank",
      rel: "noopener noreferrer",
    },
    {
      title: "MSR Styles",
      path: "/development",
      target: "_blank",
      rel: "noopener noreferrer",
    },
    {
      title: "Settings",
      list: [
        {
          title: "Template Management",
          path: "/specs-template",
          target: "_blank",
          rel: "noopener noreferrer",
        },

        {
          title: "Material Category Management",
          path: "/Materialtype",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        {
          title: "Process Management",
          path: "/processes",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        {
          title: "Master ji Management Section",
          path: "/type_management",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      ],
    },
  ],
};

export const getSidebarLinks = () => {
  const userRole = getUserRole();

  switch (userRole) {
    case "ADMIN":
      return sidebarLinksConfig.ADMIN;
    case "MERCHANT":
      return sidebarLinksConfig.MERCHANT;
    case "MASTER_JI":
      return sidebarLinksConfig.MASTER_JI;
    case "SAMPLING_MANAGER":
      return sidebarLinksConfig.SAMPLING_MANAGER;
    case "ASSISTANT_MERCHANT":
      return sidebarLinksConfig.ASSISTANT_MERCHANT;
    case "GARMENT_TECHNICIAN":
      return sidebarLinksConfig.GARMENT_TECHNICIAN;
    case "GARMENT_TECHNICIAN_ASSISTANT":
      return sidebarLinksConfig.GARMENT_TECHNICIAN_ASSISTANT;
    case "TAILOR":
      return sidebarLinksConfig.TAILOR;
    case "HOD":
      return sidebarLinksConfig.HOD;
    default:
      return [];
  }
};

export const sidebarLinks = getSidebarLinks();

// Rest of your existing code remains the same...
export const ROLE_ROUTE_ACCESS = {
  ADMIN: [
    "/admin/*",
    "/categories",
    "/merchant/account",
    "/user/detail",
    "/user-profile",
    "/help",
    "/comments",
    "/print/*",
    "/material-page/*",
    "/placement-location",
  ],

  MASTER_JI: ["/master_ji/*"],

  MERCHANT: ["/merchant/*"],

  SAMPLING_MANAGER: ["/sampling_manager/*"],

  ASSISTANT_MERCHANT: ["/assistant_merchant/*"],

  GARMENT_TECHNICIAN: ["/garment_technician/*"],

  GARMENT_TECHNICIAN_ASSISTANT: ["/garment_technician_assistant/*"],

  TAILOR: ["/tailor/*"],

  HOD: ["/hod/*"],
};

export const getUserDashboard = (role) => {
  const dashboards = {
    ADMIN: "/admin/dashboard",
    MERCHANT: "/merchant/dashboard",
    MASTER_JI: "/master_ji/dashboard",
    SAMPLING_MANAGER: "/sampling_manager/dashboard",
    ASSISTANT_MERCHANT: "/assistant_merchant/dashboard",
    GARMENT_TECHNICIAN: "/garment_technician/dashboard",
    GARMENT_TECHNICIAN_ASSISTANT: "/garment_technician_assistant/dashboard",
    TAILOR: "/tailor/dashboard",
    HOD: "/hod/dashboard",
  };

  return dashboards[role] || "/";
};

export const redirectToDashboard = (userRole, router) => {
  switch (userRole) {
    case "ADMIN":
      router.push("/admin/dashboard");
      break;
    case "ASSISTANT_MERCHANT":
      router.push("/assistant_merchant/dashboard");
      break;
    case "MASTER_JI":
      router.push("/master_ji/dashboard");
      break;
    case "SAMPLING_MANAGER":
      router.push("/sampling_manager/dashboard");
      break;
    case "GARMENT_TECHNICIAN":
      router.push("/garment_technician/dashboard");
      break;
    case "MERCHANT":
      router.push("/merchant/dashboard");
      break;
    case "TAILOR":
      router.push("/tailor/dashboard");
      break;
    case "GARMENT_TECHNICIAN_ASSISTANT":
      router.push("/garment_technician_assistant/dashboard");
      break;
    case "HOD":
      router.push("/hod/dashboard");
      break;
    default:
      router.push("/");
  }
};
