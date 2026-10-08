// Analogue gauge: a needle on a half dial, from min to max. Click it to log
// the current value.
//
//   const g = new Gauge(el, { min: 0, max: 100, unit: 'C' });
//   g.mount();  g.setValue(42);  g.setValue(3.2, 'bar');  g.destroy();
export class Gauge {
  constructor(el, { min = 0, max = 100, unit = 'C' } = {}) {
    this.el = el;
    this.min = min;
    this.max = max;
    this.unit = unit;
    this.value = min;
    // An arrow kept on the instance: `this` is this gauge whoever calls it
    // later, and destroy() can hand the SAME function back to removeEventListener.
    this.onClick = () => console.log(`${this.unit}: ${this.value}`);
  }

  setValue(v, unit = this.unit) {
    this.value = v;
    this.unit = unit;
    const pct = (v - this.min) / (this.max - this.min);
    const needle = this.el.querySelector('.needle');
    if (needle) needle.style.transform = `rotate(${pct * 180 - 90}deg)`;
  }

  mount() {
    this.el.addEventListener('click', this.onClick);
  }

  destroy() {
    this.el.removeEventListener('click', this.onClick);
  }
}
