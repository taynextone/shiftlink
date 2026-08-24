import PDFDocument from 'pdfkit';

/**
 * Befristeter Arbeitsvertrag (Kurzzeitbeschäftigung / Einzelschicht)
 * zwischen Krankenhaus und Pflegekraft — wird automatisch aus dem
 * MatchContract-Snapshot befüllt.
 *
 * Rechtlicher Rahmen: § 14 Abs. 1 TzBfG (Befristung mit Sachgrund).
 */

export type EmploymentContractData = {
  contractId: string;
  hospital: {
    clinicName: string;
    billingAddress: string | null;
    representativeName?: string | null;
    representativeRole?: string | null;
  };
  nurse: {
    displayName: string;
    firstName: string | null;
    lastName: string | null;
    dateOfBirth?: string | null;
    birthPlace?: string | null;
    address?: string | null;
    nationality?: string | null;
    socialSecurityNumber?: string | null;
    taxId?: string | null;
    healthInsurance?: string | null;
    healthInsuranceMemberNumber?: string | null;
    ibanLast4?: string | null; // NIE die volle IBAN im PDF speichern
    hourlyRate: string;
    phoneNumber?: string | null;
    email?: string | null;
    qualificationLabel?: string | null;
    hasProfessionalLicense?: boolean | null;
    hasQualificationProof?: boolean | null;
  };
  jobShift: {
    title: string | null;
    department: string | null;
    stationName: string | null;
    locationCity: string | null;
    startTime: Date | string;
    endTime: Date | string;
    totalPlannedHours: string;
    grossWage: string;
  };
  signatures?: {
    hospitalSignedAt?: Date | string | null;
    nurseSignedAt?: Date | string | null;
  };
};

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtTime(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
}

export function renderEmploymentContractPdf(data: EmploymentContractData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 60 });
    const chunks: Buffer[] = [];

    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ---------- Kopf ----------
    doc.fontSize(16).font('Helvetica-Bold').text('Befristeter Arbeitsvertrag', { align: 'center' });
    doc.fontSize(11).font('Helvetica').text('(Kurzzeitbeschäftigung / Einzelschicht)', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#666666')
      .text(`Vertragsnummer: ${data.contractId}`, { align: 'center' })
      .text(`Erstellt über ShiftLink am ${fmtDate(new Date())}`, { align: 'center' });
    doc.fillColor('#000000');
    doc.moveDown();

    doc.fontSize(10).text('zwischen');
    doc.moveDown(0.3);

    // ---------- Parteien ----------
    doc.fontSize(12).font('Helvetica-Bold').text('Arbeitgeber:');
    doc.font('Helvetica').fontSize(10);
    doc.text(data.hospital.clinicName || '—');
    if (data.hospital.billingAddress) doc.text(data.hospital.billingAddress.replace(/\n/g, ', '));
    if (data.hospital.representativeName) {
      doc.text(`vertreten durch ${data.hospital.representativeName}${data.hospital.representativeRole ? ` (${data.hospital.representativeRole})` : ''}`);
    }
    doc.moveDown();

    doc.fontSize(12).font('Helvetica-Bold').text('Arbeitnehmer/in:');
    doc.font('Helvetica').fontSize(10);
    const fullName = [data.nurse.firstName, data.nurse.lastName].filter(Boolean).join(' ') || data.nurse.displayName;
    doc.text(fullName);
    if (data.nurse.dateOfBirth) doc.text(`geboren am ${data.nurse.dateOfBirth}`);
    if (data.nurse.address) doc.text(`wohnhaft ${data.nurse.address.replace(/\n/g, ', ')}`);
    if (data.nurse.socialSecurityNumber) doc.text(`Sozialversicherungsnummer: ${data.nurse.socialSecurityNumber}`);
    if (data.nurse.taxId) doc.text(`Steuer-Identifikationsnummer: ${data.nurse.taxId}`);
    doc.text('– nachfolgend „Arbeitnehmer/in“ –');
    doc.moveDown();

    const sectionTitle = (title: string) => {
      doc.moveDown(0.4);
      doc.fontSize(11.5).font('Helvetica-Bold').text(title);
      doc.moveDown(0.2);
      doc.fontSize(10).font('Helvetica');
    };

    const para = (label: string, text: string) => {
      doc.text(`${label} ${text}`, { paragraphGap: 4 });
    };

    // ---------- § 1 ----------
    sectionTitle('§ 1 Beginn und Befristung');
    para('(1)', `Das Arbeitsverhältnis beginnt am ${fmtDate(data.jobShift.startTime)} um ${fmtTime(data.jobShift.startTime)} und endet automatisch am ${fmtDate(data.jobShift.endTime)} um ${fmtTime(data.jobShift.endTime)}, ohne dass es einer Kündigung bedarf.`);
    para('(2)', 'Die Befristung erfolgt aus sachlichem Grund gemäß § 14 Abs. 1 TzBfG wegen vorübergehenden betrieblichen Bedarfs (Vertretung bei akutem Personalausfall).');

    // ---------- § 2 ----------
    sectionTitle('§ 2 Tätigkeit und Einsatzort');
    para('(1)', 'Der/die Arbeitnehmer/in wird als examinierte Pflegefachkraft (Gesundheits- und Krankenpfleger/in bzw. Pflegefachfrau/-mann) beschäftigt.');
    para('(2)', `Einsatzort ist die Station / der Bereich „${data.jobShift.stationName ?? data.jobShift.department ?? data.jobShift.title ?? '—'}“${data.jobShift.locationCity ? ` in ${data.jobShift.locationCity}` : ''} im Hause des Arbeitgebers.`);
    para('(3)', 'Der/die Arbeitnehmer/in ist verpflichtet, die üblichen Weisungen der Stationsleitung bzw. der diensthabenden Leitung zu befolgen und die hausinternen Regelungen (Hygiene, Dokumentation, Dienstkleidung etc.) einzuhalten.');

    // ---------- § 3 ----------
    sectionTitle('§ 3 Arbeitszeit');
    doc.text(`Die Arbeitszeit beträgt ${data.jobShift.totalPlannedHours} Stunden und umfasst die Schicht von ${fmtTime(data.jobShift.startTime)} bis ${fmtTime(data.jobShift.endTime)} am ${fmtDate(data.jobShift.startTime)}.`);

    // ---------- § 4 ----------
    sectionTitle('§ 4 Vergütung');
    para('(1)', `Der/die Arbeitnehmer/in erhält für die geleistete Schicht ein Bruttoentgelt von ${data.jobShift.grossWage} Euro (${data.nurse.hourlyRate} €/Stunde × ${data.jobShift.totalPlannedHours} Stunden).`);
    para('(2)', 'Die Vergütung wird nach Abzug der gesetzlichen Abzüge (Lohnsteuer, Sozialversicherungsbeiträge) direkt durch den Arbeitgeber auf das von der/dem Arbeitnehmer/in angegebene Konto überwiesen. ShiftLink ist hierbei nicht Arbeitgeber, nicht Zahlungsdienstleister und nicht Vertragspartei.');
    if (data.nurse.ibanLast4) {
      doc.text(`Hinterlegte IBAN (letzte 4 Ziffern zur Identifikation): ****${data.nurse.ibanLast4}`);
    }

    // ---------- § 5 ----------
    sectionTitle('§ 5 Weitere Regelungen');
    para('(1)', 'Es gelten die gesetzlichen Vorschriften, insbesondere das Arbeitszeitgesetz, das Bundesurlaubsgesetz und die arbeitsschutzrechtlichen Bestimmungen.');
    para('(2)', 'Der/die Arbeitnehmer/in versichert, im Besitz einer gültigen Erlaubnis zur Führung der Berufsbezeichnung und der erforderlichen Qualifikationsnachweise zu sein und diese dem Arbeitgeber vorzulegen.');
    para('(3)', 'Änderungen und Ergänzungen dieses Vertrags bedürfen der Schriftform.');

    // ---------- § 6 ----------
    sectionTitle('§ 6 Schlussbestimmungen');
    doc.text('Sollten einzelne Bestimmungen dieses Vertrags unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.');

    // ---------- Unterschriften ----------
    doc.moveDown(1.5);
    doc.text('Ort, Datum: ______________________');
    doc.moveDown(1.5);

    const sigY = doc.y;
    const leftX = doc.page.margins.left;
    const rightX = doc.page.margins.left + 280;

    doc.text('_________________________', leftX, sigY);
    doc.text('Unterschrift Arbeitgeber', leftX, sigY + 18);
    if (data.signatures?.hospitalSignedAt) {
      doc.fontSize(8).fillColor('#10b981').text(`Elektronisch signiert am ${fmtDate(data.signatures.hospitalSignedAt)}`, leftX, sigY + 32);
      doc.fillColor('#000000').fontSize(10);
    }

    doc.text('_________________________', rightX, sigY);
    doc.text('Unterschrift Arbeitnehmer/in', rightX, sigY + 18);
    if (data.signatures?.nurseSignedAt) {
      doc.fontSize(8).fillColor('#10b981').text(`Elektronisch signiert am ${fmtDate(data.signatures.nurseSignedAt)}`, rightX, sigY + 32);
      doc.fillColor('#000000').fontSize(10);
    }

    doc.moveDown(2);
    doc.fontSize(8).fillColor('#999999')
      .text('Dieses Dokument wurde automatisch über die ShiftLink-Plattform erstellt. ShiftLink vermittelt ausschließlich den Kontakt zwischen Krankenhaus und Pflegekraft; der Arbeitsvertrag besteht ausschließlich zwischen den genannten Parteien.', { align: 'center' });

    // ================= Anlage: Personalabteilung =================
    doc.addPage();
    doc.fontSize(14).font('Helvetica-Bold').text('Anlage: Angaben zur Anmeldung der Pflegekraft', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('(Mindestangaben für die Personalabteilung)', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(8).fillColor('#666666')
      .text(`Anlage zu Vertrag ${data.contractId}`, { align: 'center' });
    doc.fillColor('#000000');

    const hrSection = (title: string) => {
      doc.moveDown(0.6);
      doc.fontSize(11).font('Helvetica-Bold').text(title);
      doc.moveDown(0.2);
      doc.fontSize(10).font('Helvetica');
    };
    const field = (label: string, value: string | null | undefined) => {
      doc.text(`${label}: ${value && value.trim() ? value : '_________________________'}`, { paragraphGap: 3 });
    };
    const checkbox = (label: string, value: boolean | null | undefined) => {
      const yes = value === true ? '[X]' : '[ ]';
      const no = value === false ? '[X]' : '[ ]';
      doc.text(`${label}: ${yes} ja  ${no} nein`, { paragraphGap: 3 });
    };

    hrSection('Persönliche Daten');
    field('Name', data.nurse.lastName);
    field('Vorname', data.nurse.firstName);
    field('Geburtsdatum', data.nurse.dateOfBirth);
    field('Geburtsort', data.nurse.birthPlace);
    field('Anschrift', data.nurse.address);
    field('Staatsangehörigkeit', data.nurse.nationality);

    hrSection('Sozialversicherung & Steuer');
    field('Sozialversicherungsnummer', data.nurse.socialSecurityNumber);
    field('Steuer-Identifikationsnummer', data.nurse.taxId);
    field('Krankenkasse', data.nurse.healthInsurance);
    field('Mitgliedsnummer (falls bekannt)', data.nurse.healthInsuranceMemberNumber);

    hrSection('Bankverbindung');
    if (data.nurse.ibanLast4) {
      doc.text(`IBAN (letzte 4 Ziffern zur Identifikation): ****${data.nurse.ibanLast4} — vollständige IBAN teilt die Pflegekraft der Personalabteilung direkt mit.`);
    } else {
      doc.text('IBAN: _________________________ (wird direkt von der Pflegekraft an die Personalabteilung übermittelt)');
    }
    doc.text('Kontoinhaber (falls abweichend): _________________________', { paragraphGap: 3 });

    hrSection('Qualifikation');
    field('Berufsbezeichnung', data.nurse.qualificationLabel ?? 'Pflegefachfrau/Pflegefachmann');
    checkbox('Erlaubnis zur Führung der Berufsbezeichnung vorhanden', data.nurse.hasProfessionalLicense);
    checkbox('Qualifikationsnachweis (Zeugnis / Urkunde) liegt vor', data.nurse.hasQualificationProof);
    checkbox('Ausweisdokument vorgelegt', null);

    hrSection('Weitere Angaben (optional)');
    field('Telefon mobil', data.nurse.phoneNumber);
    field('E-Mail', data.nurse.email);
    doc.text('Notfallkontakt: _________________________', { paragraphGap: 3 });

    doc.moveDown(1);
    field('Ort, Datum', fmtDate(new Date()));
    doc.moveDown(0.8);
    doc.text('Unterschrift Pflegekraft: _________________________');

    doc.moveDown(1.5);
    doc.fontSize(8).fillColor('#999999')
      .text('Hinweis: Felder mit Unterstrichen sind von der Pflegekraft oder der Personalabteilung nachzutragen. ShiftLink speichert keine vollständigen Bankdaten; die IBAN wird nur in den letzten vier Ziffern referenziert.', { align: 'center' });

    doc.end();
  });
}
