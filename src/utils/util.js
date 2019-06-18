function genUID() {
  let uid;
  uid  = Math.random().toString(36).substring(2, 15);
  uid += Math.random().toString(36).substring(2, 15);
  return uid;
}

function formatter(val) {
  if (val > 1e9)
    return (val/1e9).toFixed(2)+"G"
  else if (val > 1e6)
    return (val/1e6).toFixed(2)+"M"
  else if (val > 1e3)
    return (val/1e3).toFixed(2)+"k"
  else
    return val.toFixed(2)
}

export default { genUID, formatter };