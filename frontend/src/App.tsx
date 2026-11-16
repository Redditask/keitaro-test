import { Outlet } from 'react-router';
import { AppHeader } from '@/components/AppHeader/AppHeader';
import styles from './App.module.scss';

export function App() {
  return (
    <>
      <AppHeader />

      <main id="main-content" className={styles.main}>
        <Outlet />
      </main>
    </>
  );
}
