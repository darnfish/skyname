export default function Input(props: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>) {
	return (
		<input {...props} className={`outline-none px-2 py-1 mb-2 ${props.className || ''}`} />
	)
}
