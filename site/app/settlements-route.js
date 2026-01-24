import { RouteComponent } from '../components/route.js';
import { registerSettlementsComponent } from './settlements.js';

class SettlementsRoute extends RouteComponent {
    routeChangedCallback(match, systemAddress) {
        // match is the full matched string, systemAddress is the first capture group
        if (this.isActive) {
            this.innerHTML = `<x-settlements system-address="${systemAddress || ''}"></x-settlements>`;
        }
    }
}

export const registerSettlementsRouteComponent = () => {
    registerSettlementsComponent();
    customElements.define('x-settlements-route', SettlementsRoute);
}
