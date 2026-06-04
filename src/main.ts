import './styles.css';
import { App } from './components/app';
const root = document.querySelector<HTMLDivElement>('#app');

if (!root) {
  throw new Error('App root #app was not found');
}

root.replaceChildren(App());
