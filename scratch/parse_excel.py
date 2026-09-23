import zipfile
import xml.etree.ElementTree as ET

z = zipfile.ZipFile(r'C:\Users\MSI\Downloads\menu_parque_acuatico_telica.xlsx')

shared_strings = []
if 'xl/sharedStrings.xml' in z.namelist():
    tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
    for si in tree.findall('.//{*}si'):
        t_elems = si.findall('.//{*}t')
        text = "".join([t.text for t in t_elems if t.text])
        shared_strings.append(text)

sheet_bytes = z.read('xl/worksheets/sheet1.xml')
sheet_xml = ET.fromstring(sheet_bytes)
rows = sheet_xml.findall('.//{*}row')

for row in rows[:25]:
    row_idx = row.attrib.get('r')
    cells = row.findall('.//{*}c')
    row_data = []
    for cell in cells:
        cell_ref = cell.attrib.get('r')
        cell_type = cell.attrib.get('t')
        val_elem = cell.find('{*}v')
        val = val_elem.text if val_elem is not None else ""
        
        if cell_type == 's' and val.isdigit():
            val = shared_strings[int(val)]
        elif cell_type == 'inlineStr':
            is_elem = cell.find('{*}is')
            if is_elem is not None:
                t_elems = is_elem.findall('.//{*}t')
                val = "".join([t.text for t in t_elems if t.text])
        elif val_elem is None:
            t_elem = cell.find('{*}t')
            if t_elem is not None and t_elem.text:
                val = t_elem.text

        row_data.append(f"{cell_ref}:{val}")
    print(f"Row {row_idx}: {row_data}")
