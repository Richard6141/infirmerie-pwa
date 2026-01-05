import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { OfflineBanner } from './components/sync/OfflineBanner';
import { LoginPage } from './pages/Login';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { DashboardPage } from './pages/Dashboard';
import { PatientsPage } from './pages/patients/PatientsPage';
import { NewPatientPage } from './pages/patients/NewPatientPage';
import { TestPage } from './pages/patients/TestPage';
import { EditPatientPage } from './pages/patients/EditPatientPage';
import { PatientDetailPage } from './pages/patients/PatientDetailPage';
import { ConsultationsPage } from './pages/consultations/ConsultationsPage';
import { NewConsultationPage } from './pages/consultations/NewConsultationPage';
import { EditConsultationPage } from './pages/consultations/EditConsultationPage';
import { ConsultationDetailPage } from './pages/consultations/ConsultationDetailPage';
import { ReposSanitairePage, NewReposSanitairePage, EditReposSanitairePage, ReposSanitaireDetailPage } from './pages/repos-sanitaire';
import { MedicamentsPage } from './pages/medicaments/MedicamentsPage';
import { NewMedicamentPage } from './pages/medicaments/NewMedicamentPage';
import { EditMedicamentPage } from './pages/medicaments/EditMedicamentPage';
import { MedicamentDetailPage } from './pages/medicaments/MedicamentDetailPage';
import { StocksPage } from './pages/stocks/StocksPage';
import { VaccinationsPage } from './pages/vaccinations/VaccinationsPage';
import { RendezVousPage } from './pages/rendez-vous/RendezVousPage';
import { CalendrierRendezVousPage } from './pages/rendez-vous/CalendrierRendezVousPage';
import { NewRendezVousPage } from './pages/rendez-vous/NewRendezVousPage';
import { EditRendezVousPage } from './pages/rendez-vous/EditRendezVousPage';
import { RendezVousDetailPage } from './pages/rendez-vous/RendezVousDetailPage';
import { RapportsPage } from './pages/rapports/RapportsPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { Role } from './lib/types/models';
import { useAuthStore } from './lib/stores/authStore';
import { cleanupOldSyncOperations } from './lib/db/schema';

function App() {
  const loadUserFromStorage = useAuthStore(state => state.loadUserFromStorage);

  // Charger l'utilisateur depuis localStorage et nettoyer les sync operations au démarrage
  useEffect(() => {
    loadUserFromStorage();

    // Nettoyer les anciennes opérations de sync (>10 tentatives ou >3 jours)
    cleanupOldSyncOperations()
      .then(count => {
        if (count > 0 && import.meta.env.DEV) {
          console.log(`[SYNC CLEANUP] ${count} opérations de sync obsolètes supprimées`);
        }
      })
      .catch(error => {
        console.error('[SYNC CLEANUP] Erreur lors du nettoyage:', error);
      });
  }, [loadUserFromStorage]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <OfflineBanner />
      <Routes>
        {/* Route publique */}
        <Route path="/login" element={<LoginPage />} />

        {/* Route de changement de mot de passe - Authentification requise */}
        <Route path="/change-password" element={<ChangePasswordPage />} />

        {/* Route de test - PUBLIQUE */}
        <Route path="/test" element={<TestPage />} />

        {/* Routes protégées avec layout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard - Accessible à tous */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Patients - Infirmier uniquement */}
          <Route
            path="/patients"
            element={
              <ProtectedRoute allowedRoles={[Role.INFIRMIER]}>
                <PatientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/nouveau"
            element={
              <ProtectedRoute allowedRoles={[Role.INFIRMIER]}>
                <NewPatientPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/:id"
            element={
              <ProtectedRoute allowedRoles={[Role.INFIRMIER]}>
                <PatientDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/:id/modifier"
            element={
              <ProtectedRoute allowedRoles={[Role.INFIRMIER]}>
                <EditPatientPage />
              </ProtectedRoute>
            }
          />

          {/* Consultations - Accessible à tous (vue différente selon rôle) */}
          <Route path="/consultations" element={<ConsultationsPage />} />
          <Route
            path="/consultations/nouvelle"
            element={
              <ProtectedRoute allowedRoles={[Role.INFIRMIER]}>
                <NewConsultationPage />
              </ProtectedRoute>
            }
          />
          <Route path="/consultations/:id" element={<ConsultationDetailPage />} />
          <Route
            path="/consultations/:id/modifier"
            element={
              <ProtectedRoute allowedRoles={[Role.INFIRMIER]}>
                <EditConsultationPage />
              </ProtectedRoute>
            }
          />

          {/* Repos Sanitaire - Infirmier uniquement */}
          <Route
            path="/repos-sanitaire"
            element={
              <ProtectedRoute allowedRoles={[Role.INFIRMIER]}>
                <ReposSanitairePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/repos-sanitaire/nouvelle"
            element={
              <ProtectedRoute allowedRoles={[Role.INFIRMIER]}>
                <NewReposSanitairePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/repos-sanitaire/:id"
            element={
              <ProtectedRoute allowedRoles={[Role.INFIRMIER]}>
                <ReposSanitaireDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/repos-sanitaire/:id/modifier"
            element={
              <ProtectedRoute allowedRoles={[Role.INFIRMIER]}>
                <EditReposSanitairePage />
              </ProtectedRoute>
            }
          />

          {/* Médicaments - Accessible à tous (vue différente selon rôle) */}
          <Route path="/medicaments" element={<MedicamentsPage />} />
          <Route
            path="/medicaments/nouveau"
            element={
              <ProtectedRoute allowedRoles={[Role.INFIRMIER]}>
                <NewMedicamentPage />
              </ProtectedRoute>
            }
          />
          <Route path="/medicaments/:id" element={<MedicamentDetailPage />} />
          <Route
            path="/medicaments/:id/modifier"
            element={
              <ProtectedRoute allowedRoles={[Role.INFIRMIER]}>
                <EditMedicamentPage />
              </ProtectedRoute>
            }
          />

          {/* Stocks - Infirmier uniquement */}
          <Route
            path="/stocks"
            element={
              <ProtectedRoute allowedRoles={[Role.INFIRMIER]}>
                <StocksPage />
              </ProtectedRoute>
            }
          />

          {/* Vaccinations - Accessible à tous (vue différente selon rôle) */}
          <Route path="/vaccinations" element={<VaccinationsPage />} />

          {/* Rendez-vous - Accessible à tous (vue différente selon rôle) */}
          <Route path="/rendez-vous" element={<CalendrierRendezVousPage />} />
          <Route path="/rendez-vous/liste" element={<RendezVousPage />} />
          <Route
            path="/rendez-vous/nouveau"
            element={
              <ProtectedRoute allowedRoles={[Role.INFIRMIER]}>
                <NewRendezVousPage />
              </ProtectedRoute>
            }
          />
          <Route path="/rendez-vous/:id" element={<RendezVousDetailPage />} />
          <Route
            path="/rendez-vous/:id/modifier"
            element={
              <ProtectedRoute allowedRoles={[Role.INFIRMIER]}>
                <EditRendezVousPage />
              </ProtectedRoute>
            }
          />

          {/* Rapports - Infirmier uniquement */}
          <Route
            path="/rapports"
            element={
              <ProtectedRoute allowedRoles={[Role.INFIRMIER]}>
                <RapportsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Redirection par défaut */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Route 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
// FORCE REBUILD 1766848999
