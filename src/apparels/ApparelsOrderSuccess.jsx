import { Link, useParams } from 'react-router-dom'
import Icon from '../components/Icon'
import { WHATSAPP_NUMBER } from '../config'

export default function ApparelsOrderSuccess() {
  const { orderNumber } = useParams()

  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hi, I just placed order ${orderNumber} on Dhanshri's Store. Please confirm.`
  )}`

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16">
      <div className="max-w-xl mx-auto bg-surface-container-high rounded-3xl border border-primary-fixed/30 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary-fixed/15 text-primary-fixed mx-auto flex items-center justify-center mb-4">
          <Icon name="check_circle" className="!text-4xl" filled />
        </div>
        <h1 className="font-display-lg text-headline-lg text-on-surface mb-2">Order placed!</h1>
        <p className="font-body-md text-on-surface-variant mb-4">
          Thank you for shopping with Dhanshri's Store. We've received your order and will reach out shortly to confirm.
        </p>

        <div className="bg-surface-container rounded-xl border border-outline-variant/20 px-4 py-3 inline-block mb-6">
          <p className="font-label-mono text-label-mono text-on-surface-variant uppercase">Order number</p>
          <p className="font-display-lg text-headline-md text-primary-fixed font-bold">{orderNumber}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="bg-primary-fixed text-on-primary-fixed px-6 py-3 rounded-xl font-bold hover:scale-95 transition-all neon-glow flex items-center justify-center gap-2"
          >
            <Icon name="chat" className="!text-base" /> Confirm on WhatsApp
          </a>
          <Link
            to="/apparels"
            className="border-2 border-outline-variant/40 text-on-surface px-6 py-3 rounded-xl font-bold hover:border-primary-fixed/50 transition-all flex items-center justify-center gap-2"
          >
            <Icon name="checkroom" className="!text-base" /> Continue shopping
          </Link>
        </div>

        <p className="font-body-md text-xs text-on-surface-variant mt-6">
          Save this order number — you'll need it for any questions about your order.
        </p>
      </div>
    </div>
  )
}
