# Add-ons

Add-ons are separate resources built on bzn's public API. They are optional: install the
ones you want, next to bzn_core.

| Add-on | What it does | Repository |
| --- | --- | --- |
| [bzn_vehicledata](vehicledata.md) | mileage and bodywork dents for owned vehicles | [BZN-Development/bzn_vehicledata](https://github.com/BZN-Development/bzn_vehicledata) |

Start add-ons after bzn_core (and ox_inventory):

```cfg
ensure bzn_core
ensure ox_inventory
ensure bzn_vehicledata
```
