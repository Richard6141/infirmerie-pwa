import jsPDF from 'jspdf';
import type { ReposSanitaire } from '@/types/repos-sanitaire';
import { formaterDateRepos } from '@/types/repos-sanitaire';

/**
 * Générer un PDF professionnel pour une fiche de repos sanitaire
 * @param repos Données de la fiche de repos sanitaire
 */
export function generateReposSanitairePDF(
  repos: ReposSanitaire,
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let yPos = 20;

  // ==================== FILIGRANE (WATERMARK) ====================
  doc.saveGraphicsState();
  doc.setFontSize(60);
  doc.setTextColor(245, 245, 245); // Très très clair
  doc.setFont('helvetica', 'bold');
  doc.text('Infirmerie MDC', pageWidth / 2, pageHeight / 2, {
    align: 'center',
    angle: 45,
  });
  doc.restoreGraphicsState();

  // ==================== EN-TÊTE ====================
  // Chemins vers les assets dans le dossier public/
  const logoPath = '/logo-ministere.png';
  const signaturePath = '/signature-infirmier.png';

  // Logo à gauche
  // Note: addImage peut prendre une URL vers une image du dossier public
  try {
    // On tente d'utiliser le logo s'il existe dans le dossier public
    // Pour éviter les erreurs bloquantes, on utilise un try/catch
    doc.addImage(logoPath, 'PNG', marginLeft, yPos, 25, 25);
  } catch (error) {
    // Placeholder si l'image n'est pas trouvée
    doc.setDrawColor(200);
    doc.setLineWidth(0.1);
    doc.rect(marginLeft, yPos, 25, 25);
    doc.setFontSize(8);
    doc.text('LOGO', marginLeft + 12.5, yPos + 12.5, { align: 'center' });
  }

  // Texte Ministère à gauche
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const ministryText = [
    'MINISTÈRE DU DÉVELOPPEMENT',
    'ET DE LA COORDINATION DE',
    "L'ACTION GOUVERNEMENTALE",
    '-------------------------',
    'RÉPUBLIQUE DU BÉNIN',
  ];

  ministryText.forEach((line, index) => {
    doc.text(line, marginLeft, yPos + 30 + (index * 4));
  });

  // Informations de contact à droite
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const contactInfo = [
    '08 BP 755 Cotonou',
    'BÉNIN',
    'Tél: +229 21 30 94 00',
    'mdc.info@gouv.bj',
    'www.dev.gouv.bj',
  ];

  contactInfo.forEach((line, index) => {
    doc.text(line, pageWidth - marginRight, yPos + 5 + (index * 5), { align: 'right' });
  });

  yPos += 55;

  // Date et Lieu
  const dateLieu = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(`${repos.lieuRedaction || 'Cotonou'}, le ${dateLieu}`, pageWidth - marginRight, yPos, { align: 'right' });

  yPos += 15;

  // ==================== TITRE ====================
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FICHE DE REPOS SANITAIRE', pageWidth / 2, yPos, { align: 'center' });

  // Ligne de séparation
  yPos += 2;
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(marginLeft + 40, yPos, pageWidth - marginRight - 40, yPos);

  yPos += 15;

  // ==================== CORPS DU DOCUMENT ====================
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const lineSpacing = 10;

  const drawDottedLine = (x1: number, y1: number, x2: number) => {
    doc.setDrawColor(200);
    doc.setLineDashPattern([0.5, 1], 0);
    doc.line(x1, y1, x2, y1);
    doc.setLineDashPattern([], 0);
  };

  doc.text('Je soussigné', marginLeft, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(repos.nomInfirmier, marginLeft + 25, yPos);
  drawDottedLine(marginLeft + 25, yPos + 1, pageWidth - marginRight);
  yPos += lineSpacing;

  doc.setFont('helvetica', 'normal');
  doc.text("Infirmier du MDC reconnais avoir examiné ce jour", marginLeft, yPos);
  const dateExamen = formaterDateRepos(repos.dateExamen);
  doc.setFont('helvetica', 'bold');
  doc.text(dateExamen, marginLeft + 85, yPos);
  drawDottedLine(marginLeft + 85, yPos + 1, pageWidth - marginRight);
  yPos += lineSpacing;

  doc.setFont('helvetica', 'normal');
  doc.text('Monsieur (Madame)', marginLeft, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(repos.nomPatient, marginLeft + 35, yPos);
  drawDottedLine(marginLeft + 35, yPos + 1, pageWidth - marginRight);
  yPos += lineSpacing;

  doc.setFont('helvetica', 'normal');
  doc.text('Agé(e) de', marginLeft, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(`${repos.agePatient} ans`, marginLeft + 20, yPos);
  drawDottedLine(marginLeft + 20, yPos + 1, pageWidth - marginRight);
  yPos += lineSpacing;

  doc.setFont('helvetica', 'normal');
  doc.text('Diagnostic final :', marginLeft, yPos);
  yPos += 7;
  const diagnosticLines = doc.splitTextToSize(repos.diagnosticFinal, contentWidth);
  diagnosticLines.forEach((line: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(line, marginLeft + 5, yPos);
    drawDottedLine(marginLeft + 5, yPos + 1, pageWidth - marginRight);
    yPos += 8;
  });
  yPos += 2;

  doc.setFont('helvetica', 'normal');
  doc.text('Soins institués :', marginLeft, yPos);
  yPos += 7;
  const soinsLines = doc.splitTextToSize(repos.soinsInstitues, contentWidth);
  soinsLines.forEach((line: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(line, marginLeft + 5, yPos);
    drawDottedLine(marginLeft + 5, yPos + 1, pageWidth - marginRight);
    yPos += 8;
  });
  yPos += 2;

  doc.setFont('helvetica', 'normal');
  doc.text('Repos physique de', marginLeft, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(`${repos.dureeRepos} jours`, marginLeft + 35, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text('du', marginLeft + 55, yPos);
  const dateDebut = formaterDateRepos(repos.dateDebut);
  doc.setFont('helvetica', 'bold');
  doc.text(dateDebut, marginLeft + 62, yPos);
  drawDottedLine(marginLeft + 35, yPos + 1, marginLeft + 53);
  drawDottedLine(marginLeft + 62, yPos + 1, pageWidth - marginRight);
  yPos += lineSpacing;

  doc.setFont('helvetica', 'normal');
  doc.text('A revoir le', marginLeft, yPos);
  if (repos.dateControle) {
    const dateControle = formaterDateRepos(repos.dateControle);
    doc.setFont('helvetica', 'bold');
    doc.text(dateControle, marginLeft + 22, yPos);
  }
  doc.setFont('helvetica', 'normal');
  doc.text('pour contrôle physique.', pageWidth - marginRight, yPos, { align: 'right' });
  drawDottedLine(marginLeft + 22, yPos + 1, pageWidth - marginRight - 45);
  yPos += 20;

  // ==================== SIGNATURE ====================
  const signatureX = pageWidth - marginRight - 50;

  try {
    doc.addImage(signaturePath, 'PNG', signatureX, yPos - 15, 50, 20);
  } catch (error) {
    // Ignorer si la signature n'existe pas encore
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('SIGNATURE', signatureX + 25, yPos, { align: 'center' });

  yPos += 15;
  doc.setFont('helvetica', 'bold');
  doc.text(repos.nomInfirmier, signatureX + 25, yPos, { align: 'center' });

  // ==================== PIED DE PAGE ====================
  const stripeHeight = 3;
  const stripeWidth = pageWidth / 3;
  doc.setFillColor(0, 135, 82);
  doc.rect(0, pageHeight - stripeHeight, stripeWidth, stripeHeight, 'F');
  doc.setFillColor(252, 209, 22);
  doc.rect(stripeWidth, pageHeight - stripeHeight, stripeWidth, stripeHeight, 'F');
  doc.setFillColor(232, 17, 45);
  doc.rect(stripeWidth * 2, pageHeight - stripeHeight, stripeWidth, stripeHeight, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(
    'Infirmerie du Ministère du Développement et de la Coordination de l\'Action Gouvernementale',
    pageWidth / 2,
    pageHeight - 15,
    { align: 'center' }
  );

  const fileName = `fiche_repos_sanitaire_${repos.nomPatient.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}
