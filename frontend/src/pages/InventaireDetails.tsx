
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { ArrowLeft, CheckCircle, Download, XCircle } from 'lucide-react';


interface InventoryItem {
    id: number;
    materiel: {
        id: number;
        nom: string;
        numero_inventaire: string;
        photo_url?: string;
        service?: string;
    };
    scanne_par: string; // user_id
    created_at: string;
    agent_name?: string; // joined
}

interface MissingItem {
    id: number;
    nom: string;
    numero_inventaire: string;
    service?: string;
    photo_url?: string;
}

const InventaireDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [scannedItems, setScannedItems] = useState<InventoryItem[]>([]);
    const [missingItems, setMissingItems] = useState<MissingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'scanned' | 'missing'>('scanned');
    const [inventaireInfo, setInventaireInfo] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            // 1. Get Inventory Info
            const { data: inv } = await supabase.from('inventaires').select('*').eq('id', id).single();
            setInventaireInfo(inv);

            // 2. Get Scanned Items (with Materiel details and Profile name)
            const { data: scans, error: scanError } = await supabase
                .from('inventaire_lignes')
                .select(`
                    *,
                    materiel:materiels(*),
                    agent:scanne_par(full_name) 
                `)
                .eq('inventaire_id', id);

            if (scanError) throw scanError;

            // Flatten data for easier use
            const formattedScans = scans.map((line: any) => ({
                ...line,
                agent_name: line.agent?.full_name || 'Inconnu',
                created_at: line.date_scan || line.created_at // Compatibility
            }));
            setScannedItems(formattedScans);

            // 3. Calculate Missing Items
            // Logic: All Active Materiels NOT IN Scanned Material IDs
            const scannedIds = scans.map((s: any) => s.materiel_id);

            let query = supabase.from('materiels').select('*').neq('statut', 'Rebut');
            // If the inventory has specific scope (e.g. only one service), filter here?
            // For now, assuming Global Inventory on the whole active stock.

            const { data: allMateriels } = await query;

            if (allMateriels) {
                const missing = allMateriels.filter(m => !scannedIds.includes(m.id));
                setMissingItems(missing);
            }

        } catch (error) {
            console.error("Error loading details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        const ExcelJS = await import('exceljs');
        const saveAs = (await import('file-saver')).default;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Inventaire Complet");

        // 1. Add Header Image
        try {
            const response = await fetch('/header.png');
            const buffer = await response.arrayBuffer();
            const imageId = workbook.addImage({
                buffer: buffer,
                extension: 'png',
            });
            worksheet.addImage(imageId, {
                tl: { col: 0, row: 0 },
                ext: { width: 500, height: 60 }
            });
        } catch (e) {
            console.warn("Header image not found for Excel", e);
        }

        // 2. Metadata (starting after image)
        worksheet.addRow([]); worksheet.addRow([]); worksheet.addRow([]); worksheet.addRow([]); // Spacers

        const titleRow = worksheet.addRow([`RAPPORT D'INVENTAIRE CONSOLIDÉ`]);
        titleRow.font = { bold: true, size: 14 };

        const campaignRow = worksheet.addRow([`Campagne : ${inventaireInfo?.nom}`]);
        campaignRow.font = { bold: true };

        worksheet.addRow([`Date de génération : ${new Date().toLocaleString()}`]);
        worksheet.addRow([]); // Spacer

        // 3. Prepare Consolidated Data
        // Combine everything: all materials + their scan status
        const allData = [...scannedItems.map(i => ({ ...i.materiel, scanned: true, scanDetails: i })),
        ...missingItems.map(i => ({ ...i, scanned: false, scanDetails: null }))];

        // Sort by Category then Name
        allData.sort((a: any, b: any) => (a.categorie || '').localeCompare(b.categorie || '') || a.nom.localeCompare(b.nom));

        const formattedData = allData.map((item: any) => ({
            'Nom Article': item.nom,
            'N° Inventaire': item.numero_inventaire,
            'Statut Inventaire': item.scanned ? 'PRÉSENT' : 'ABSENT',
            'Service': item.service || 'N/A',
            'État': item.statut || 'N/A',
            'Catégorie': item.categorie || 'N/A',
            'Localisation': item.emplacement || 'N/A',
            'Scanné Par': item.scanDetails ? (item.scanDetails as any).agent_name : '-',
            'Date Scan': item.scanDetails ? new Date((item.scanDetails as any).created_at).toLocaleString() : '-'
        }));

        // 4. Add Table
        const columns = Object.keys(formattedData[0] || {}).map(key => ({ header: key, key: key, width: 22 }));
        worksheet.columns = columns;

        // Header style
        const headerRowIndex = 9;
        const headerRow = worksheet.getRow(headerRowIndex);
        columns.forEach((col, idx) => {
            const cell = headerRow.getCell(idx + 1);
            cell.value = col.header;
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF1F497D' } // Navy blue
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        // Data rows with conditional formatting for Status
        formattedData.forEach((item) => {
            const row = worksheet.addRow(item);
            const statusCell = row.getCell(3); // 'Statut Inventaire' column
            if (item['Statut Inventaire'] === 'PRÉSENT') {
                statusCell.font = { color: { argb: 'FF008000' }, bold: true }; // Green
            } else {
                statusCell.font = { color: { argb: 'FFFF0000' }, bold: true }; // Red
            }
        });

        // 5. Add Footer Image & Signature
        const footerStartRow = worksheet.lastRow ? worksheet.lastRow.number + 2 : 15;

        const footerTextRow = worksheet.getRow(footerStartRow);
        footerTextRow.values = ["Signature de l'Agent Responsable :", "", "", "Cachet de l'Hôpital :"];
        footerTextRow.font = { italic: true, bold: true };

        try {
            const response = await fetch('/footer.png');
            const buffer = await response.arrayBuffer();
            const imageId = workbook.addImage({
                buffer: buffer,
                extension: 'png',
            });
            worksheet.addImage(imageId, {
                tl: { col: 0, row: footerStartRow + 2 },
                ext: { width: 500, height: 40 }
            });
        } catch (e) {
            console.warn("Footer image not found for Excel", e);
        }

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `Rapport_Inventaire_Consolide_${inventaireInfo?.nom}.xlsx`);
    };

    const handleGeneratePDF = async (type: 'scanned' | 'missing') => {
        const { jsPDF } = await import('jspdf');
        await import('jspdf-autotable');

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        const addFooterLogo = () => {
            try {
                doc.addImage('/footer.png', 'PNG', 0, pageHeight - 20, pageWidth, 20);
            } catch (e) {
                console.warn("Footer image not found, skipping");
            }
        };

        // Title & Info
        const reportTitle = type === 'scanned' ? "RAPPORT MATÉRIELS PRÉSENTS" : "RAPPORT MATÉRIELS MANQUANTS";
        doc.setFontSize(16);
        doc.text(reportTitle, pageWidth / 2, 45, { align: 'center' });

        doc.setFontSize(11);
        doc.text(inventaireInfo?.nom || '', pageWidth / 2, 52, { align: 'center' });

        doc.setFontSize(8);
        doc.text(`Date du rapport: ${new Date().toLocaleDateString()}`, 14, 62);
        doc.text(`Période: Du ${new Date(inventaireInfo?.date_debut).toLocaleDateString()} au ${inventaireInfo?.date_fin ? new Date(inventaireInfo.date_fin).toLocaleDateString() : 'En cours'}`, 14, 67);
        doc.text(`Statistiques: ${scannedItems.length} présents / ${missingItems.length} manquants (Total: ${scannedItems.length + missingItems.length})`, 14, 72);

        const tableData = type === 'scanned'
            ? scannedItems.map(i => [i.materiel.nom, i.materiel.numero_inventaire, i.materiel.service || '-', i.agent_name, new Date(i.created_at).toLocaleDateString()])
            : missingItems.map(i => [i.nom, i.numero_inventaire, i.service || '-']);

        const tableHead = type === 'scanned'
            ? [['Nom', 'N° Inventaire', 'Service', 'Scanné par', 'Date']]
            : [['Nom', 'N° Inventaire', 'Service']];

        (doc as any).autoTable({
            startY: 78,
            head: tableHead,
            body: tableData,
            theme: 'striped',
            styles: { fontSize: 8, cellPadding: 1 },
            headStyles: { fillColor: type === 'scanned' ? [31, 73, 125] : [192, 0, 0], fontSize: 9 },
            margin: { top: 35, bottom: 25 },
            didDrawPage: () => {
                // Header on every page
                doc.addImage('/header.png', 'PNG', 0, 0, pageWidth, 30);
            }
        });

        // Signatures area
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        let sigY: number;

        if (finalY > pageHeight - 40) {
            doc.addPage();
            doc.addImage('/header.png', 'PNG', 0, 0, pageWidth, 30);
            sigY = 50;
        } else {
            sigY = finalY;
        }

        doc.setFontSize(9);
        doc.text("Signature de l'Agent Responsable", 14, sigY);
        doc.text("Cachet de l'Hôpital", pageWidth - 60, sigY);
        doc.line(14, sigY + 10, 70, sigY + 10);
        doc.line(pageWidth - 60, sigY + 10, pageWidth - 14, sigY + 10);

        addFooterLogo();

        doc.save(`Rapport_${type === 'scanned' ? 'Presents' : 'Manquants'}_${inventaireInfo?.nom}.pdf`);
    };

    if (loading) return <div className="p-8 text-center">Chargement...</div>;

    const total = scannedItems.length + missingItems.length;
    const progress = total > 0 ? Math.round((scannedItems.length / total) * 100) : 0;

    return (
        <div className="p-6 max-w-7xl mx-auto animate-fade-in">
            <Link to="/inventaire" className="flex items-center text-gray-600 mb-4 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux campagnes
            </Link>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{inventaireInfo?.nom}</h1>
                        <p className="text-sm text-gray-500">
                            Du {new Date(inventaireInfo?.date_debut).toLocaleDateString()}
                            {inventaireInfo?.date_fin && ` au ${new Date(inventaireInfo.date_fin).toLocaleDateString()}`}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                            onClick={handleExport}
                            className="flex items-center justify-center bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition shadow-sm text-sm"
                            title="Export complet Excel"
                        >
                            <Download className="w-4 h-4 mr-2" /> Excel
                        </button>
                        <button
                            onClick={() => handleGeneratePDF('scanned')}
                            className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition shadow-sm text-sm"
                        >
                            <Download className="w-4 h-4 mr-2" /> PDF Présents
                        </button>
                        <button
                            onClick={() => handleGeneratePDF('missing')}
                            className="flex items-center justify-center bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition shadow-sm text-sm"
                        >
                            <Download className="w-4 h-4 mr-2" /> PDF Manquants
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-2 flex justify-between text-sm font-medium">
                    <span>Progression</span>
                    <span>{progress}% ({scannedItems.length} / {total})</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
                    <div
                        className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-4">
                    <button
                        className={`py-2 px-4 font-medium flex items-center ${activeTab === 'scanned' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('scanned')}
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Présents ({scannedItems.length})
                    </button>
                    <button
                        className={`py-2 px-4 font-medium flex items-center ${activeTab === 'missing' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('missing')}
                    >
                        <XCircle className="w-4 h-4 mr-2" />
                        Manquants ({missingItems.length})
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matériel</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                                {activeTab === 'scanned' && (
                                    <>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scanné par</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Heure</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {activeTab === 'scanned' ? (
                                scannedItems.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                {item.materiel.photo_url ? (
                                                    <img src={item.materiel.photo_url} className="h-10 w-10 rounded-full object-cover mr-3" />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-gray-200 mr-3 flex items-center justify-center text-gray-500 text-xs">IMG</div>
                                                )}
                                                <div>
                                                    <div className="font-medium text-gray-900">{item.materiel.nom}</div>
                                                    <div className="text-xs text-gray-500 font-mono">{item.materiel.numero_inventaire}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{item.materiel.service || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{item.agent_name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(item.created_at).toLocaleTimeString()}</td>
                                    </tr>
                                ))
                            ) : (
                                missingItems.map(item => (
                                    <tr key={item.id} className="hover:bg-red-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                {item.photo_url ? (
                                                    <img src={item.photo_url} className="h-10 w-10 rounded-full object-cover mr-3 grayscale" />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-gray-200 mr-3 flex items-center justify-center text-gray-500 text-xs">IMG</div>
                                                )}
                                                <div>
                                                    <div className="font-medium text-gray-900">{item.nom}</div>
                                                    <div className="text-xs text-red-500 font-mono">{item.numero_inventaire}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{item.service || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    {activeTab === 'scanned' && scannedItems.length === 0 && (
                        <div className="p-8 text-center text-gray-500">Aucun élément scanné pour le moment.</div>
                    )}
                    {activeTab === 'missing' && missingItems.length === 0 && (
                        <div className="p-8 text-center text-green-600 font-medium">Incroyable ! Aucun élément manquant.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InventaireDetails;
