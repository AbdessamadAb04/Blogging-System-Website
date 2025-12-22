import React from 'react'

export default function Headline({
  prehead,
  title,
  subtitle,
}: {
  prehead?: string
  title: React.ReactNode
  subtitle?: string
}) {
  return (
    <header className="mb-6 text-center">
      {prehead && <div className="upheading text-gray-500">{prehead}</div>}
      <h2 className="mt-2 text-h2 text-text">{title}</h2>
      {subtitle && <p className="subheading mt-2 max-w-2xl mx-auto">{subtitle}</p>}
    </header>
  )
}
