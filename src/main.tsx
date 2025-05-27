import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// import StagewiseIntegration from './components/StagewiseIntegration'

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    {/* <StagewiseIntegration /> */}
  </>
);
