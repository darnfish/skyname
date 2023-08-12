export default function Select(props: React.DetailedHTMLProps<React.SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>) {
	return (
		<select {...props} className={`outline-none px-2 py-1 mb-2 ${props.className || ''}`} />
	)
}
