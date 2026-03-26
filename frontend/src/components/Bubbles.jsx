export default function Bubbles() {
  return (
    <div className="bubbles-bg">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bubble" />
      ))}
    </div>
  )
}
