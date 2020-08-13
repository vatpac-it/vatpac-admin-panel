Date.prototype.isSameDateAs = isSameDateAs;

interface Date {
  isSameDateAs: typeof isSameDateAs;
}

function isSameDateAs(pDate) {
  return (
    this.getFullYear() === pDate.getFullYear() &&
    this.getMonth() === pDate.getMonth() &&
    this.getDate() === pDate.getDate()
  );
}
