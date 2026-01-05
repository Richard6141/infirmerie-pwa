import jsPDF from 'jspdf';
import type { ReposSanitaire } from '@/types/repos-sanitaire';
import { formaterDuree, formaterDateRepos, formaterSexe } from '@/types/repos-sanitaire';

/**
 * Générer un PDF professionnel pour une fiche de repos sanitaire
 * @param repos Données de la fiche de repos sanitaire
 * @param logoDataUrl URL du logo MDC (optionnel)
 */
export function generateReposSanitairePDF(
  repos: ReposSanitaire,
  logoDataUrl?: string,
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let yPos = 20;

  // ==================== EN-TÊTE ====================
  // Logo à gauche (si fourni)
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', marginLeft, yPos, 30, 30);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du logo:', error);
    }
  }

  // Informations du ministère à droite
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const textXPos = logoDataUrl ? marginLeft + 35 : marginLeft;

  const headerText = [
    'Ministère du Développement et de la Coordination',
    'de l\'Action Gouvernementale',
    'Infirmerie - Direction des Ressources Humaines',
    'Cotonou, République du Bénin',
  ];

  headerText.forEach((line, index) => {
    doc.text(line, textXPos, yPos + index * 6, { maxWidth: contentWidth - 35 });
  });

  yPos += 40;

  // Date du document
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const dateDoc = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Date: ${dateDoc}`, marginLeft, yPos);
  yPos += 15;

  // ==================== TITRE ====================
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FICHE DE REPOS SANITAIRE', pageWidth / 2, yPos, {
    align: 'center',
  });

  // Ligne de séparation sous le titre
  yPos += 5;
  doc.setDrawColor(0, 102, 255); // Bleu
  doc.setLineWidth(0.5);
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
  yPos += 15;

  // ==================== CORPS ADMINISTRATIF ====================
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  // Introduction
  const dateExamen = formaterDateRepos(repos.dateExamen);
  const sexeLabel = formaterSexe(repos.sexePatient);

  const introText = `Je soussigné ${repos.nomInfirmier}, Infirmier du Ministère du Développement et de la Coordination de l'Action Gouvernementale, reconnais avoir examiné ce jour ${dateExamen} ${sexeLabel} ${repos.nomPatient}, âgé(e) de ${repos.agePatient} ans, matricule ${repos.matriculePatient}.`;

  const introLines = doc.splitTextToSize(introText, contentWidth);
  doc.text(introLines, marginLeft, yPos);
  yPos += introLines.length * 7 + 10;

  // ==================== DIAGNOSTIC ====================
  doc.setFont('helvetica', 'bold');
  doc.text('Diagnostic final :', marginLeft, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 7;

  const diagnosticLines = doc.splitTextToSize(
    repos.diagnosticFinal,
    contentWidth - 10,
  );
  doc.text(diagnosticLines, marginLeft + 5, yPos);
  yPos += diagnosticLines.length * 7 + 10;

  // ==================== SOINS ====================
  doc.setFont('helvetica', 'bold');
  doc.text('Soins institués :', marginLeft, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 7;

  const soinsLines = doc.splitTextToSize(
    repos.soinsInstitues,
    contentWidth - 10,
  );
  doc.text(soinsLines, marginLeft + 5, yPos);
  yPos += soinsLines.length * 7 + 10;

  // ==================== REPOS ====================
  doc.setFont('helvetica', 'bold');
  const dureeText = `Repos physique de : ${formaterDuree(repos.dureeRepos)}`;
  doc.text(dureeText, marginLeft, yPos);
  yPos += 10;

  const dateDebut = formaterDateRepos(repos.dateDebut);
  const dateFin = formaterDateRepos(repos.dateFin);
  doc.text(`Du ${dateDebut} au ${dateFin}`, marginLeft, yPos);
  yPos += 15;

  // ==================== DATE CONTRÔLE ====================
  if (repos.dateControle) {
    const dateControle = formaterDateRepos(repos.dateControle);
    doc.text(
      `À revoir le ${dateControle} pour contrôle physique.`,
      marginLeft,
      yPos,
    );
    yPos += 15;
  }

  // ==================== SIGNATURE ====================
  yPos += 20;

  // Fait à + date
  const dateLieu = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.setFont('helvetica', 'normal');
  doc.text(`Fait à ${repos.lieuRedaction}, le ${dateLieu}`, marginLeft, yPos);
  yPos += 20;

  // Signature
  doc.setFont('helvetica', 'bold');
  doc.text("L'Infirmier", pageWidth - marginRight - 40, yPos);
  yPos += 30;

  // Ligne de signature
  doc.setDrawColor(150);
  doc.setLineWidth(0.3);
  doc.line(
    pageWidth - marginRight - 60,
    yPos,
    pageWidth - marginRight,
    yPos,
  );

  // Label "Signature"
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Signature', pageWidth - marginRight - 30, yPos + 5, {
    align: 'center',
  });

  // ==================== PIED DE PAGE ====================
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(
    'Ce document est délivré pour servir et valoir ce que de droit.',
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 15,
    { align: 'center' },
  );

  // ==================== TÉLÉCHARGER ====================
  const fileName = `fiche_repos_sanitaire_${repos.nomPatient.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
  doc.save(fileName);
}
