interface CTAButtonProps {
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  type?: 'button' | 'submit';
  fullWidth?: boolean;
  variant?: 'primary' | 'light';
  disabled?: boolean;
  className?: string;
}

export default function CTAButton({
  children,
  size = 'medium',
  onClick,
  type = 'button',
  fullWidth = false,
  variant = 'primary',
  disabled = false,
  className = '',
}: CTAButtonProps) {
  const sizeClasses = {
    small: 'px-4 py-2 text-[14px]',
    medium: 'px-6 py-3 text-[16px]',
    large: 'px-8 py-4 text-[16px]',
  };

  const base = `${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} font-semibold uppercase rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2`;

  const variants: Record<string, string> = {
    primary: `bg-[#0077B6] text-white hover:bg-[#005f8f] focus:ring-[#0077B6]`,
    // increased border thickness for the light variant (used by Sign up)
    light: `bg-white text-[#0077B6] border-2 border-[#0077B6] hover:bg-[#E7F4F7] focus:ring-[#0077B6]`,
  };

  const variantClass = variants[variant] || variants.primary;
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variantClass} ${disabledClass} ${className}`}
    >
      {children}
    </button>
  );
}
