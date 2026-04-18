interface SizeGuideProps {
  className?: string;
}

const SizeGuide = ({ className }: SizeGuideProps) => {
  return (
    <div className={`glass-card rounded-xl p-4 ${className ?? ""}`}>
      <h3 className="font-semibold text-foreground mb-2">Guia de medidas</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left py-1">Tamanho</th>
              <th className="text-left py-1">Peito</th>
              <th className="text-left py-1">Comprimento</th>
            </tr>
          </thead>
          <tbody className="text-foreground">
            <tr><td className="py-1">P</td><td className="py-1">92-96 cm</td><td className="py-1">68 cm</td></tr>
            <tr><td className="py-1">M</td><td className="py-1">97-102 cm</td><td className="py-1">71 cm</td></tr>
            <tr><td className="py-1">G</td><td className="py-1">103-110 cm</td><td className="py-1">74 cm</td></tr>
            <tr><td className="py-1">GG</td><td className="py-1">111-118 cm</td><td className="py-1">77 cm</td></tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground mt-2">O modelo tem 1,75m e veste M.</p>
    </div>
  );
};

export default SizeGuide;
