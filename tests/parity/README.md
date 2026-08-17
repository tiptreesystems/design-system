# Dormant Button parity research

`consumer-run.mjs` is the reusable geometry/identity comparison engine retained
for future component migrations. `run.mjs` and `button.html` record the Button
delivery proof that produced the identity/geometry contract; they are dormant,
not invoked by package scripts or CI, and expect the v0.3.x Button CSS restored
from Git history before reuse.

No Button CSS or markup contract is published in v0.4.0. A future Button effort
must first name a production consumer and follow `docs/ADDING_A_COMPONENT.md`.
