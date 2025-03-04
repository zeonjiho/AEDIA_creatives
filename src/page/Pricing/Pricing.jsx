import React from 'react'
import ss from './Pricing.module.css'

const Pricing = () => {
    const plans = [
        {
            name: "Free",
            price: "0",
            features: [
                "Basic features",
                "Up to 10 posts per day",
                "Standard support",
                "Community access"
            ],
            isPopular: false,
            buttonText: "Get Started"
        },
        {
            name: "Pro",
            price: "19",
            features: [
                "All Free features",
                "Unlimited posts",
                "Priority support",
                "AI-powered features",
                "Advanced analytics",
                "Custom domain"
            ],
            isPopular: true,
            buttonText: "Try Pro"
        },
        {
            name: "Enterprise",
            price: "99",
            features: [
                "All Pro features",
                "Dedicated support",
                "Custom integration",
                "Team collaboration",
                "Advanced security",
                "SLA guarantee"
            ],
            isPopular: false,
            buttonText: "Contact Sales"
        }
    ]

    return (
        <div className={ss.container}>
            <div className={ss.header}>
                <h1>Simple, transparent pricing</h1>
                <p>Choose the perfect plan for your needs</p>
            </div>
            <div className={ss.plans}>
                {plans.map((plan, index) => (
                    <div key={index} className={`${ss.plan} ${plan.isPopular ? ss.popular : ''}`}>
                        {plan.isPopular && <div className={ss.popularBadge}>Most Popular</div>}
                        <div className={ss.planHeader}>
                            <h2>{plan.name}</h2>
                            <div className={ss.price}>
                                <span className={ss.currency}>$</span>
                                <span className={ss.amount}>{plan.price}</span>
                                <span className={ss.period}>/month</span>
                            </div>
                        </div>
                        <ul className={ss.features}>
                            {plan.features.map((feature, idx) => (
                                <li key={idx}>{feature}</li>
                            ))}
                        </ul>
                        <button className={`${ss.button} ${plan.isPopular ? ss.popularButton : ''}`}>
                            {plan.buttonText}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Pricing 