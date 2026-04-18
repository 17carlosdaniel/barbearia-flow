import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, FileText, CreditCard, ShoppingBag, Ban, RefreshCcw, Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const sections = [
  {
    title: "1. Introducao",
    icon: FileText,
    text: "Bem-vindo ao BarberFlow. Ao acessar ou usar nossa plataforma, voce concorda com estes Termos de Uso.",
  },
  {
    title: "2. Conta do usuario",
    icon: ShieldCheck,
    text: "Cada usuario e responsavel por manter a seguranca da conta, senha e dados de acesso.",
  },
  {
    title: "3. Uso da plataforma",
    icon: FileText,
    text: "O BarberFlow permite agendamento de servicos, compra de produtos e gestao de barbearias em ambiente digital.",
  },
  {
    title: "4. Pagamentos",
    icon: CreditCard,
    text: "Pagamentos sao processados por meios seguros. O BarberFlow nao armazena dados completos de cartao.",
  },
  {
    title: "5. Cancelamentos",
    icon: RefreshCcw,
    text: "O usuario pode cancelar agendamentos conforme as regras definidas por cada barbearia.",
  },
  {
    title: "6. Produtos e marketplace",
    icon: ShoppingBag,
    text: "Produtos sao ofertados por barbearias parceiras, que sao responsaveis por qualidade, disponibilidade e entrega.",
  },
  {
    title: "7. Responsabilidades",
    icon: ShieldCheck,
    text: "O BarberFlow atua como intermediador digital e nao se responsabiliza por falhas de execucao dos servicos prestados por terceiros.",
  },
  {
    title: "8. Uso indevido",
    icon: Ban,
    text: "E proibido usar a plataforma para atividades ilegais, fraudulentas ou que violem direitos de terceiros.",
  },
  {
    title: "9. Alteracoes",
    icon: RefreshCcw,
    text: "Estes termos podem ser atualizados a qualquer momento. A versao vigente ficara disponivel nesta pagina.",
  },
  {
    title: "10. Contato",
    icon: Phone,
    text: "Para duvidas, fale com nosso suporte: suporte@barberflow.com.br.",
  },
];

const Terms = () => {
  const { user } = useAuth();
  const backPath = user?.role === "barbeiro" ? "/barbeiro" : user?.role === "cliente" ? "/cliente" : "/";

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto space-y-6">
        <Link
          to={backPath}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <div className="glass-card rounded-xl p-6 md:p-8 border border-primary/20">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Termos de Uso</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Ultima atualizacao: 20 de Marco de 2026
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            Este resumo ajuda voce a entender os pontos principais antes da leitura completa.
          </p>
          <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
            <li>Voce pode agendar e comprar produtos na plataforma.</li>
            <li>Seus dados sao protegidos com boas praticas de seguranca.</li>
            <li>Pagamentos sao processados por meios seguros.</li>
            <li>Cancelamentos seguem regras da barbearia escolhida.</li>
          </ul>
        </div>

        <div className="space-y-3">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-xl p-5 border border-border/60"
              >
                <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary" />
                  {section.title}
                </h2>
                <p className="text-sm text-muted-foreground mt-2">{section.text}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default Terms;
