export const BUSINESS_NAME = "Dhanshri's Gaming Vault"
export const OWNER_NAME = 'Yash Agre'
export const WHATSAPP_NUMBER = '919370493240'
export const DELIVERY_FEE = 30
export const SERVICE_CITY = 'Nagpur'

export const ADDRESS = {
  line1: 'B-102, Pyramid Gold',
  line2: 'Besa Pipla Road',
  city: 'Nagpur',
  pincode: '440034',
  state: 'Maharashtra',
}

export const ADDRESS_FULL = `${ADDRESS.line1}, ${ADDRESS.line2}, ${ADDRESS.city} - ${ADDRESS.pincode}, ${ADDRESS.state}`

export const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS_FULL)}`

export const CONSOLES = [
  {
    id: 'ps5',
    name: 'PlayStation 5',
    subtitle: 'Latest Slim Edition',
    price: 999,
    extraControllerPrice: 299,
    tier: 'Premium Tier',
    tierClass: 'bg-primary-fixed text-on-primary-fixed',
    image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=1200&q=80',
    cta: 'Rent PS5 Now',
  },
  {
    id: 'ps4',
    name: 'PlayStation 4',
    subtitle: 'Classic Library',
    price: 799,
    extraControllerPrice: 199,
    tier: 'Mid Tier',
    tierClass: 'bg-tertiary-container text-on-tertiary-container',
    image: 'https://images.unsplash.com/photo-1700154636736-cb5f4c3751b3?auto=format&fit=crop&w=1200&q=80',
    cta: 'Rent PS4 Now',
  },
  {
    id: 'xbox',
    name: 'Xbox Series S',
    subtitle: 'Compact Performance',
    price: 599,
    extraControllerPrice: 199,
    tier: 'Value Tier',
    tierClass: 'bg-secondary-container text-on-secondary-container',
    image: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?auto=format&fit=crop&w=1200&q=80',
    cta: 'Rent Xbox Now',
  },
]

export const DAY_PRESETS = [1, 2, 3]
export const MAX_RENTAL_DAYS = 3
export const MAX_ADVANCE_BOOKING_DAYS = 30
