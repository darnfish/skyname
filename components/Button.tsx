export default function Button(props: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) {
	return (
		<button {...props} className={`bg-black/10 px-2 py-1 ${props.disabled ? 'opacity-50 cursor-not-allowed' : 'text-white bg-blue-500 hover:bg-blue-600 active:bg-blue-400'} ${props.className || ''}`} />
	)
}
