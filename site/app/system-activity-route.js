import { RouteComponent } from '../components/route.js';
import { registerSystemActivityComponent } from './system-activity.js';

class SystemRoute extends RouteComponent {
    routeChangedCallback(match, id) {
        // match is the full matched string, id is the first capture group
        if (this.isActive) {
            this.innerHTML = `<x-system-activity system-address="${id}"</x-system-activity>`;
        }
    }
}

export const registerSystemRouteComponent = () => {
    registerSystemActivityComponent();
    customElements.define('x-system-activity-route', SystemRoute);
}
