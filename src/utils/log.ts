export default function log(data: any, note?: string | number) {
  const _note = typeof note == 'string' ? note : 'Line: ' + note
  console.log(`-----------------DEBUG---${_note}------------------------`)
  console.log(data)
}
