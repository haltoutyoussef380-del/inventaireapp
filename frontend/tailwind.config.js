/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                gst: {
                    dark: '#1B365D',
                    light: '#00A3E0',
                    accent: '#63b3ed'
                }
            }
        },
    },
    plugins: [],
}
