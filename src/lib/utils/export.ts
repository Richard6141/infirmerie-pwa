import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Export PDF pour les rapports
export function exportToPDF(data: any, title: string, orientation: 'portrait' | 'landscape' = 'portrait') {
  const doc = new jsPDF({ orientation });

  // En-tête
  doc.setFontSize(20);
  doc.text(title, 14, 22);

  // Date d'export
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, 30);

  return doc;
}

// Export Excel pour les données tabulaires
export function exportToExcel(data: any[], fileName: string, sheetName: string = 'Sheet1') {
  // Créer un nouveau classeur
  const wb = XLSX.utils.book_new();

  // Créer une feuille à partir des données
  const ws = XLSX.utils.json_to_sheet(data);

  // Ajuster la largeur des colonnes
  const maxWidth = data.reduce((w: any, r: any) => {
    return Object.keys(r).reduce((acc, key) => {
      const value = r[key] ? String(r[key]) : '';
      acc[key] = Math.max(acc[key] || 10, value.length + 2);
      return acc;
    }, w);
  }, {});

  ws['!cols'] = Object.keys(maxWidth).map(key => ({ wch: Math.min(maxWidth[key], 50) }));

  // Ajouter la feuille au classeur
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Télécharger le fichier
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

// Export Dashboard PDF
export function exportDashboardPDF(stats: any) {
  const doc = exportToPDF(stats, 'Tableau de Bord - Statistiques Générales');

  let yPos = 40;

  // Statistiques clés
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Statistiques clés', 14, yPos);
  yPos += 10;

  const statsData = [
    ['Total Patients', stats.totalPatients],
    ['Consultations (mois)', stats.consultationsMoisEnCours],
    ['Vaccinations (mois)', stats.vaccinationsMoisEnCours],
    ['Rendez-vous à venir', stats.rendezVousAVenir],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Indicateur', 'Valeur']],
    body: statsData,
    theme: 'grid',
    headStyles: { fillColor: [147, 51, 234] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Top motifs de consultation
  if (stats.topMotifsConsultations && stats.topMotifsConsultations.length > 0) {
    doc.setFontSize(14);
    doc.text('Top Motifs de Consultation', 14, yPos);
    yPos += 10;

    const motifsData = stats.topMotifsConsultations.slice(0, 5).map((item: any) => [
      item.motif,
      item.count
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Motif', 'Nombre']],
      body: motifsData,
      theme: 'grid',
      headStyles: { fillColor: [147, 51, 234] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Répartition par direction
  if (stats.repartitionPatientsParDirection && stats.repartitionPatientsParDirection.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.text('Patients par Direction', 14, yPos);
    yPos += 10;

    const directionsData = stats.repartitionPatientsParDirection.map((item: any) => [
      item.direction,
      item.count
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Direction', 'Nombre de patients']],
      body: directionsData,
      theme: 'grid',
      headStyles: { fillColor: [147, 51, 234] },
    });
  }

  // Télécharger
  doc.save(`rapport-dashboard-${new Date().toISOString().split('T')[0]}.pdf`);
}

// Export Consultations PDF
export function exportConsultationsPDF(stats: any) {
  const doc = exportToPDF(stats, 'Rapport Consultations', 'landscape');

  let yPos = 40;

  // Résumé
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Résumé de la période', 14, yPos);
  yPos += 10;

  const periode = stats.periode ? `Du ${new Date(stats.periode.debut).toLocaleDateString('fr-FR')} au ${new Date(stats.periode.fin).toLocaleDateString('fr-FR')}` : 'Non spécifiée';
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(periode, 14, yPos);
  yPos += 10;

  const resumeData = [
    ['Total Consultations', stats.totalConsultations],
    ['Consultations terminées', stats.consultationsParStatut?.terminees || 0],
    ['Consultations en cours', stats.consultationsParStatut?.enCours || 0],
    ['Consultations annulées', stats.consultationsParStatut?.annulees || 0],
    ['Durée moyenne', stats.moyenneDuree ? `${stats.moyenneDuree} min` : 'N/A'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Indicateur', 'Valeur']],
    body: resumeData,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Top motifs
  if (stats.topMotifs && stats.topMotifs.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Top Motifs de Consultation', 14, yPos);
    yPos += 10;

    const motifsData = stats.topMotifs.map((item: any) => [
      item.motif,
      item.count
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Motif', 'Nombre']],
      body: motifsData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
    });
  }

  doc.save(`rapport-consultations-${new Date().toISOString().split('T')[0]}.pdf`);
}

// Export Stocks PDF
export function exportStocksPDF(stats: any) {
  const doc = exportToPDF(stats, 'Rapport Stocks');

  let yPos = 40;

  // Période
  if (stats.periode) {
    const periode = `Du ${new Date(stats.periode.debut).toLocaleDateString('fr-FR')} au ${new Date(stats.periode.fin).toLocaleDateString('fr-FR')}`;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(periode, 14, yPos);
    yPos += 10;
  }

  // Alertes de rupture
  if (stats.alertesRuptures && stats.alertesRuptures.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(220, 38, 38);
    doc.text('⚠️ Alertes de Rupture de Stock', 14, yPos);
    yPos += 10;

    const alertesData = stats.alertesRuptures.map((item: any) => [
      item.code,
      item.nomCommercial,
      item.quantiteActuelle,
      item.seuilMin,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Code', 'Nom', 'Qté Actuelle', 'Seuil Min']],
      body: alertesData,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Médicaments les plus consommés
  if (stats.medicamentsPlusConsommes && stats.medicamentsPlusConsommes.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Médicaments les Plus Consommés', 14, yPos);
    yPos += 10;

    const consommesData = stats.medicamentsPlusConsommes.map((item: any) => [
      item.nomCommercial,
      item.quantiteConsommee,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Médicament', 'Quantité Consommée']],
      body: consommesData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });
  }

  doc.save(`rapport-stocks-${new Date().toISOString().split('T')[0]}.pdf`);
}

// Export Vaccinations PDF
export function exportVaccinationsPDF(stats: any) {
  const doc = exportToPDF(stats, 'Rapport Vaccinations');

  let yPos = 40;

  // Période
  if (stats.periode) {
    const periode = `Du ${new Date(stats.periode.debut).toLocaleDateString('fr-FR')} au ${new Date(stats.periode.fin).toLocaleDateString('fr-FR')}`;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(periode, 14, yPos);
    yPos += 10;
  }

  // Résumé
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Résumé', 14, yPos);
  yPos += 10;

  const resumeData = [
    ['Total Vaccinations', stats.totalVaccinations],
    ['Taux de Couverture', stats.couvertureVaccinale ? `${stats.couvertureVaccinale.pourcentage.toFixed(1)}%` : 'N/A'],
    ['Personnes Vaccinées', stats.couvertureVaccinale?.vaccines || 0],
    ['Personnes Éligibles', stats.couvertureVaccinale?.eligible || 0],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Indicateur', 'Valeur']],
    body: resumeData,
    theme: 'grid',
    headStyles: { fillColor: [234, 88, 12] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Statistiques par type
  if (stats.statistiquesParType && stats.statistiquesParType.length > 0) {
    doc.setFontSize(14);
    doc.text('Répartition par Type de Vaccin', 14, yPos);
    yPos += 10;

    const typesData = stats.statistiquesParType.map((item: any) => [
      item.typeVaccin,
      item.count,
      `${item.pourcentage.toFixed(1)}%`
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Type de Vaccin', 'Nombre', '%']],
      body: typesData,
      theme: 'grid',
      headStyles: { fillColor: [234, 88, 12] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Rappels à venir
  if (stats.rappelsAVenir && stats.rappelsAVenir.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.text('Rappels à Venir', 14, yPos);
    yPos += 10;

    const rappelsData = stats.rappelsAVenir.slice(0, 10).map((item: any) => [
      item.nomPatient,
      item.typeVaccin,
      new Date(item.dateRappel).toLocaleDateString('fr-FR'),
      item.statut,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Patient', 'Vaccin', 'Date Rappel', 'Statut']],
      body: rappelsData,
      theme: 'grid',
      headStyles: { fillColor: [234, 88, 12] },
    });
  }

  doc.save(`rapport-vaccinations-${new Date().toISOString().split('T')[0]}.pdf`);
}

// Export Excel Dashboard
export function exportDashboardExcel(stats: any) {
  const statsArray = [
    {
      'Indicateur': 'Total Patients',
      'Valeur': stats.totalPatients
    },
    {
      'Indicateur': 'Consultations (mois)',
      'Valeur': stats.consultationsMoisEnCours
    },
    {
      'Indicateur': 'Vaccinations (mois)',
      'Valeur': stats.vaccinationsMoisEnCours
    },
    {
      'Indicateur': 'Rendez-vous à venir',
      'Valeur': stats.rendezVousAVenir
    }
  ];

  exportToExcel(statsArray, `dashboard-${new Date().toISOString().split('T')[0]}`, 'Statistiques');
}
