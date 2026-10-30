import CustomNode from '../components/CustomNode';
import ContainerNode from '../components/ContainerNode';
import RubricNode from './RubricNode';
import SampleNode from './SampleNode';
import MCANode from './MCANode';
import TableNode from './TableNode';
import PdfExtractorNode from './PdfExtractorNode';

export const nodeTypes = {
  customNode: CustomNode,
  containerNode: ContainerNode,
  rubric: RubricNode,
  mca: MCANode,
  sample: SampleNode,
  table: TableNode,
  pdfExtractor: PdfExtractorNode,
};

export default nodeTypes;

