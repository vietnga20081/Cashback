declare const _default: {
    darkMode: ["class"];
    content: string[];
    theme: {
        container: {
            center: true;
            padding: string;
            screens: {
                '2xl': string;
            };
        };
        extend: {
            colors: {
                primary: {
                    DEFAULT: string;
                    hover: string;
                    50: string;
                    100: string;
                    200: string;
                    300: string;
                    400: string;
                    500: string;
                    600: string;
                    700: string;
                    800: string;
                    900: string;
                };
                secondary: {
                    DEFAULT: string;
                };
                background: string;
                card: {
                    DEFAULT: string;
                    foreground: string;
                };
                foreground: string;
                success: string;
                warning: string;
                danger: string;
                info: string;
                border: string;
                input: string;
                ring: string;
                muted: {
                    DEFAULT: string;
                    foreground: string;
                };
                accent: {
                    DEFAULT: string;
                    foreground: string;
                };
                destructive: {
                    DEFAULT: string;
                    foreground: string;
                };
                popover: {
                    DEFAULT: string;
                    foreground: string;
                };
            };
            borderRadius: {
                DEFAULT: string;
                lg: string;
                md: string;
                sm: string;
                xs: string;
            };
            boxShadow: {
                card: string;
                'card-hover': string;
                soft: string;
                green: string;
            };
            fontFamily: {
                sans: [string, string, string];
                display: [string, string, string];
                mono: [string, string];
            };
            animation: {
                'fade-in': string;
                'slide-up': string;
                'slide-down': string;
                'scale-in': string;
                shimmer: string;
                'pulse-green': string;
                'count-up': string;
            };
            keyframes: {
                fadeIn: {
                    '0%': {
                        opacity: string;
                    };
                    '100%': {
                        opacity: string;
                    };
                };
                slideUp: {
                    '0%': {
                        opacity: string;
                        transform: string;
                    };
                    '100%': {
                        opacity: string;
                        transform: string;
                    };
                };
                slideDown: {
                    '0%': {
                        opacity: string;
                        transform: string;
                    };
                    '100%': {
                        opacity: string;
                        transform: string;
                    };
                };
                scaleIn: {
                    '0%': {
                        opacity: string;
                        transform: string;
                    };
                    '100%': {
                        opacity: string;
                        transform: string;
                    };
                };
                shimmer: {
                    '0%': {
                        backgroundPosition: string;
                    };
                    '100%': {
                        backgroundPosition: string;
                    };
                };
                pulseGreen: {
                    '0%, 100%': {
                        boxShadow: string;
                    };
                    '50%': {
                        boxShadow: string;
                    };
                };
                countUp: {
                    '0%': {
                        opacity: string;
                        transform: string;
                    };
                    '100%': {
                        opacity: string;
                        transform: string;
                    };
                };
            };
            backdropBlur: {
                xs: string;
            };
        };
    };
    plugins: {
        handler: () => void;
    }[];
};
export default _default;
