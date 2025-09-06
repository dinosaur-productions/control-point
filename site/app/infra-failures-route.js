import { RouteComponent } from '../components/route.js';
import { registerInfraFailuresComponent } from './infra-failures.js';

class InfraFailuresRoute extends RouteComponent {
    routeChangedCallback(match, systemName) {
        // match is the full matched string, systemName is the first capture group
        if (this.isActive) {
            this.innerHTML = `<x-infra-failures origin-system="${systemName || '3824408316259'}"></x-infra-failures>`;
        }
    }
}

export const registerInfraFailuresRouteComponent = () => {
    registerInfraFailuresComponent();
    customElements.define('x-infra-failures-route', InfraFailuresRoute);
}
