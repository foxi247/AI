import Link from 'next/link'
import { Check, Zap } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Button from '@/components/ui/Button'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    desc: 'Perfect for exploring and hobby projects',
    cta: 'Get started free',
    href: '/auth/signup',
    highlight: false,
    features: [
      '3 projects',
      '50 AI requests/month',
      'Instant preview',
      'Basic code editor',
      'Community support',
      'Public projects only',
    ],
    missing: ['Deploy to public URL', 'Custom domains', 'Collaboration', 'Private projects', 'Priority AI'],
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    desc: 'For serious builders and freelancers',
    cta: 'Start Pro',
    href: '/auth/signup?plan=pro',
    highlight: true,
    features: [
      'Unlimited projects',
      '500 AI requests/month',
      'Deploy to public URL',
      'Custom domains',
      'Private projects',
      'Version history',
      'Environment variables',
      'Priority support',
    ],
    missing: ['Team collaboration', 'Unlimited AI'],
  },
  {
    name: 'Team',
    price: '$49',
    period: '/month',
    desc: 'For teams building together',
    cta: 'Start Team',
    href: '/auth/signup?plan=team',
    highlight: false,
    features: [
      'Everything in Pro',
      'Unlimited AI requests',
      'Real-time collaboration',
      'Team management',
      'Shared projects',
      'Advanced analytics',
      'SSO / SAML',
      'Dedicated support',
      'Custom AI integrations',
    ],
    missing: [],
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <div className="pt-32 pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-black mb-4">Simple, transparent pricing</h1>
            <p className="text-[var(--text-muted)] text-lg">Start free. Upgrade when you need more.</p>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 border transition-all ${
                  plan.highlight
                    ? 'bg-gradient-to-b from-violet-900/40 to-violet-900/10 border-violet-500/50 shadow-xl shadow-violet-500/10'
                    : 'bg-[var(--surface)] border-[var(--border)]'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-violet-600 to-purple-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="text-lg font-bold mb-1">{plan.name}</h2>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-black">{plan.price}</span>
                    <span className="text-[var(--text-muted)] text-sm">{plan.period}</span>
                  </div>
                  <p className="text-sm text-[var(--text-muted)]">{plan.desc}</p>
                </div>

                <Link href={plan.href}>
                  <Button variant={plan.highlight ? 'primary' : 'secondary'} className="w-full mb-8">
                    {plan.cta}
                  </Button>
                </Link>

                <div className="space-y-3">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-3 text-sm">
                      <Check className="w-4 h-4 text-green-400 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                  {plan.missing.map((f) => (
                    <div key={f} className="flex items-center gap-3 text-sm opacity-40">
                      <div className="w-4 h-4 rounded-full border border-current shrink-0 flex items-center justify-center">
                        <span className="text-[8px]">✕</span>
                      </div>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently asked questions</h2>
            <div className="space-y-6">
              {[
                { q: 'Can I use my own AI API keys?', a: 'Yes! You can add any OpenAI, Anthropic, Mistral, Google, or other OpenAI-compatible API keys. Assign them different roles in your project.' },
                { q: 'What counts as an AI request?', a: 'Each message you send to the AI chat counts as one request. The AI response, regardless of length, is included in that single request.' },
                { q: 'Can I cancel anytime?', a: 'Absolutely. No contracts, no commitments. Cancel from your dashboard and you\'ll keep access until the end of your billing period.' },
                { q: 'What is Mistral Codestral?', a: 'Mistral Codestral is a state-of-the-art code generation model. We use it as our default AI agent, already configured and ready to use on all plans.' },
              ].map(({ q, a }) => (
                <div key={q} className="border border-[var(--border)] rounded-xl p-6">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-violet-400" />
                    {q}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
