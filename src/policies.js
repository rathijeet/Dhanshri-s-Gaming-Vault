import { BUSINESS_NAME, DELIVERY_FEE, SERVICE_CITY, WHATSAPP_NUMBER } from './config'

const CONTACT_LINE = `WhatsApp: +91 ${WHATSAPP_NUMBER.slice(2)} | Service Area: ${SERVICE_CITY}`
const EFFECTIVE_DATE = '14 May 2026'

export const POLICIES = {
  terms: {
    id: 'terms',
    title: 'Terms of Service',
    intro: `These Rental Terms govern every booking placed with ${BUSINESS_NAME} ("we", "us"). By confirming a booking — via WhatsApp, phone, or our website — you ("Renter", "you") agree to the terms below.`,
    sections: [
      {
        heading: '1. Eligibility',
        body: [
          'You must be 18 years or older to rent equipment.',
          'You must hold a valid Aadhar card and reside within our service area in Nagpur.',
          'You must provide accurate contact and delivery details at the time of booking.',
        ],
      },
      {
        heading: '2. Equipment Provided',
        body: [
          'A rental includes the console (PS5 or Xbox Series S), the configured controllers, all required cables (power, HDMI, charging), and any pre-installed games or subscriptions listed at booking.',
          'All equipment remains the sole property of ' + BUSINESS_NAME + '. You receive a temporary right of use only.',
        ],
      },
      {
        heading: '3. Pricing, Payment & Delivery',
        body: [
          'Rental rates are quoted per day. The current rates are listed on our website and confirmed in your WhatsApp booking.',
          `A flat setup and delivery fee of ₹${DELIVERY_FEE} applies to every rental and is non-refundable once the equipment has been dispatched.`,
          'A refundable security deposit, communicated at booking, must be paid before delivery.',
          'Payment is accepted via UPI, cash, or bank transfer. The deposit is returned within 24 hours of safe return.',
        ],
      },
      {
        heading: '4. Rental Period & Late Return',
        body: [
          'Your rental starts at the agreed delivery time and ends at the agreed return time, both confirmed in writing on WhatsApp.',
          'Extensions are subject to availability and must be requested at least 2 hours before the scheduled return.',
          'A late fee of ₹100 per hour will apply for any return beyond the agreed time without prior approval.',
        ],
      },
      {
        heading: '5. Use of Equipment',
        body: [
          'Equipment must be used indoors only and handled with reasonable care.',
          'You may not sublet, resell, or transfer the equipment to any other person.',
          'You may not modify the console firmware, jailbreak the system, or install unauthorised software.',
          'Tampering with serial numbers or security seals will result in forfeit of the full deposit.',
        ],
      },
      {
        heading: '6. Damage, Loss & Theft',
        body: [
          'You are responsible for the equipment from the moment of delivery to the moment of return inspection.',
          'See our Damage Policy for the full assessment process and rates.',
        ],
      },
      {
        heading: '7. Cancellations',
        body: [
          'Cancellations made more than 12 hours before delivery are refunded in full.',
          'Cancellations within 12 hours are subject to the non-refundable delivery fee.',
          'Once equipment has been delivered, the rental cannot be cancelled.',
        ],
      },
      {
        heading: '8. Refusal of Service',
        body: [
          'We reserve the right to refuse or cancel any booking where verification fails, the address falls outside our service area, or where we have reasonable concern about misuse.',
        ],
      },
      {
        heading: '9. Limitation of Liability',
        body: [
          'We are not liable for any loss of game progress, save data, or in-game purchases.',
          'We are not liable for indirect or consequential losses arising from equipment downtime.',
        ],
      },
      {
        heading: '10. Governing Law',
        body: [
          'These terms are governed by the laws of India. Any dispute will be subject to the jurisdiction of the courts in Nagpur, Maharashtra.',
        ],
      },
    ],
    footerNote: CONTACT_LINE + ' • Effective: ' + EFFECTIVE_DATE,
  },

  privacy: {
    id: 'privacy',
    title: 'Privacy Policy',
    intro: `${BUSINESS_NAME} takes your privacy seriously. This policy explains what we collect, why we collect it, and how we keep it safe.`,
    sections: [
      {
        heading: '1. What We Collect',
        body: [
          'Booking details: your name, phone number, delivery address, rental dates, and console choice.',
          'Verification details: a copy of your Aadhar card and, where applicable, a recent utility bill — used only to confirm identity and residence.',
          'Payment metadata: UPI/transaction reference (not your full card or banking credentials).',
          'Communication history: WhatsApp messages with us about your booking.',
        ],
      },
      {
        heading: '2. Why We Collect It',
        body: [
          'To deliver, set up, and recover rental equipment safely.',
          'To verify that we are renting to a real, locally-resident adult.',
          'To process refunds, deposits, and late fees correctly.',
          'To contact you about your active booking — never for unrelated marketing without consent.',
        ],
      },
      {
        heading: '3. How We Store It',
        body: [
          'Aadhar copies and identity documents are stored in encrypted, access-controlled storage.',
          'Booking and contact data is kept for as long as you are an active customer, plus 12 months after your last rental for accounting and audit purposes.',
          'We do not sell, rent, or share your data with third parties for marketing.',
        ],
      },
      {
        heading: '4. Sharing',
        body: [
          'We may share data with law-enforcement agencies if compelled by a valid legal order.',
          'We may share minimal contact details with our local delivery partner solely to complete your booking.',
        ],
      },
      {
        heading: '5. Your Rights',
        body: [
          'You can request a copy of the personal data we hold about you.',
          'You can request correction or deletion of your data after your rental is closed.',
          'You can withdraw consent for non-essential communication at any time.',
        ],
      },
      {
        heading: '6. Contact',
        body: [
          'For any privacy-related question, message us on WhatsApp at +91 ' + WHATSAPP_NUMBER.slice(2) + '.',
        ],
      },
    ],
    footerNote: CONTACT_LINE + ' • Effective: ' + EFFECTIVE_DATE,
  },

  damage: {
    id: 'damage',
    title: 'Damage Policy',
    intro: `Our rental equipment is professional-grade and must be returned in the same condition it was delivered. This policy explains how damage is assessed and charged.`,
    sections: [
      {
        heading: '1. Inspection',
        body: [
          'Every console, controller, and cable is inspected and photographed at delivery in your presence.',
          'A return inspection is performed at pickup. Both you and our team must agree on the condition before the equipment leaves your premises.',
        ],
      },
      {
        heading: '2. Standard Wear vs. Damage',
        body: [
          'Light cosmetic wear from normal handling is not charged.',
          'Damage covers: cracked shells, deep scratches on the disc tray or lens, broken controller sticks or buttons, frayed or cut cables, liquid ingress, and burnt-out HDMI/USB ports.',
        ],
      },
      {
        heading: '3. Damage Charges',
        body: [
          'Damage costs are first deducted from your refundable security deposit.',
          'If damage exceeds the deposit, you agree to pay the additional cost of repair or, where the equipment is beyond repair, the current replacement cost.',
          'Indicative replacement reference: PS5 console ₹45,000 • Xbox Series S console ₹35,000 • Controller ₹6,000 • HDMI/Power cable ₹500. Actual charges follow current market rates at the time of damage.',
        ],
      },
      {
        heading: '4. Liquid & Burn Damage',
        body: [
          'Liquid spills, water damage, or burn marks always void the deposit in full and the equipment is treated as a total loss.',
        ],
      },
      {
        heading: '5. Loss or Theft',
        body: [
          'If equipment is lost or stolen during your rental, you must file a police report within 24 hours and share a copy with us.',
          'You remain liable for the full replacement cost regardless of fault.',
        ],
      },
      {
        heading: '6. Dispute Resolution',
        body: [
          'If you disagree with a damage assessment, you may request a written quote from a third-party repair centre within 7 days. We will review the quote and adjust charges in good faith.',
        ],
      },
    ],
    footerNote: CONTACT_LINE + ' • Effective: ' + EFFECTIVE_DATE,
  },

  aadhar: {
    id: 'aadhar',
    title: 'Aadhar Verification',
    intro: `To keep our community safe and our equipment accountable, ${BUSINESS_NAME} requires every first-time renter to complete a one-time Aadhar verification. Here's exactly how it works.`,
    sections: [
      {
        heading: '1. Why We Verify',
        body: [
          'To confirm you are 18 years or older.',
          'To confirm you are a real, locally-resident person we can reach in case of an issue.',
          'To deter theft and fraud — which keeps prices low for honest renters.',
        ],
      },
      {
        heading: '2. What We Ask For',
        body: [
          'A clear photo or scan of your Aadhar card (front side is sufficient).',
          'Optionally, a recent utility bill or rental agreement to confirm the delivery address.',
          'We do NOT ask for your Aadhar OTP, bank details, or any PIN/password.',
        ],
      },
      {
        heading: '3. How We Handle Your Aadhar',
        body: [
          'Your Aadhar image is stored in encrypted storage with restricted access. Only authorised staff can view it.',
          'We mask the first 8 digits in our internal records, keeping only the last 4 for reference.',
          'We never share your Aadhar with any other customer, vendor, or marketing partner.',
          'You may request deletion of your Aadhar image 90 days after your last rental.',
        ],
      },
      {
        heading: '4. Holding ID as Security',
        body: [
          'For high-value rentals, we may request to hold an original photo ID (not your Aadhar) as security during the rental period. This is optional and agreed at booking.',
          'The original is returned the moment the equipment is returned and inspected.',
        ],
      },
      {
        heading: '5. Refusal to Verify',
        body: [
          'We reserve the right to refuse service if verification fails, the document appears tampered with, or the details do not match the booking.',
        ],
      },
      {
        heading: '6. Your Rights',
        body: [
          'You can ask us to delete your verification record after your last rental. See our Privacy Policy for the full process.',
        ],
      },
    ],
    footerNote: CONTACT_LINE + ' • Effective: ' + EFFECTIVE_DATE,
  },
}
