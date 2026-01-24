import { RouteComponent } from '../components/route.js';
import { registerSettlementMapsComponent } from './settlement-maps.js';

class SettlementMapsRoute extends RouteComponent {
    routeChangedCallback(_match, settlementId) {
        if (!this.isActive) return;
        if (!this.innerComponent) {
            this.innerHTML = '<x-settlement-maps></x-settlement-maps>';
            this.innerComponent = this.querySelector('x-settlement-maps');
        }

        if (this.innerComponent) {
            if (settlementId) this.innerComponent.setAttribute('selected-id', settlementId);
            else this.innerComponent.removeAttribute('selected-id');
        }
    }
}

export const registerSettlementMapsRouteComponent = () => {
    registerSettlementMapsComponent();
    customElements.define('x-settlement-maps-route', SettlementMapsRoute);
};
