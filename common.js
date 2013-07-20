Array.prototype.first = function () {
  return this.length ? this[0] : null;
};

Array.prototype.second = function () {
  return this.length > 1 ? this[1] : null;
};

Array.prototype.last = function () {
  return this.length ? this[this.length-1] : null;
};

l = function (text) {
  console.log(text);
};