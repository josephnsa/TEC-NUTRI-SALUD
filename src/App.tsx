import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { KetoMercado } from "./pages/KetoMercado";
import { Belleza } from "./pages/Belleza";
import { MiPlan } from "./pages/MiPlan";
import { Cronograma } from "./pages/Cronograma";
import { Login } from "./pages/Login";
import { ActualizarClave } from "./pages/ActualizarClave";
import { Agente } from "./pages/Agente";
import { MiEspacio } from "./pages/MiEspacio";
import { NotFound } from "./pages/NotFound";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mi-espacio" element={<MiEspacio />} />
        <Route path="/keto-mercado" element={<KetoMercado />} />
        <Route path="/belleza" element={<Belleza />} />
        <Route path="/mi-plan" element={<MiPlan />} />
        <Route path="/cronograma" element={<Cronograma />} />
        <Route path="/agente" element={<Agente />} />
        <Route path="/login" element={<Login />} />
        <Route path="/actualizar-clave" element={<ActualizarClave />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
