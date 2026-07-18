import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — EstampaHub" },
      { name: "description", content: "Saiba como o EstampaHub coleta, utiliza e protege seus dados pessoais em conformidade com a LGPD." },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Política de Privacidade — EstampaHub" },
      { property: "og:description", content: "Como tratamos seus dados pessoais em conformidade com a LGPD." },
      { property: "og:type", content: "article" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <SiteLayout>
      <article className="mx-auto max-w-3xl px-4 py-16 text-sm leading-relaxed text-muted-foreground">
        <h1 className="mb-2 font-display text-3xl font-bold text-foreground">Política de Privacidade</h1>
        <p className="mb-8 text-xs">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

        <p className="mb-6">
          O EstampaHub ("nós", "nosso") respeita a sua privacidade e está comprometido em proteger seus dados pessoais.
          Esta política descreve como coletamos, utilizamos e protegemos suas informações, em conformidade com a Lei Geral
          de Proteção de Dados (LGPD - Lei nº 13.709/2018).
        </p>

        <h2 className="mb-2 mt-8 font-display text-xl font-semibold text-foreground">1. Dados que coletamos</h2>
        <ul className="mb-4 list-disc space-y-1 pl-6">
          <li><strong>Cadastro:</strong> nome, e-mail e senha (criptografada).</li>
          <li><strong>Pagamento:</strong> dados de pagamento são processados diretamente por Stripe e Mercado Pago — não armazenamos números de cartão.</li>
          <li><strong>Uso:</strong> histórico de downloads, favoritos, artes adquiridas e créditos utilizados.</li>
          <li><strong>Técnicos:</strong> endereço IP, tipo de navegador e cookies essenciais.</li>
        </ul>

        <h2 className="mb-2 mt-8 font-display text-xl font-semibold text-foreground">2. Finalidade do tratamento</h2>
        <p className="mb-4">Utilizamos seus dados para: (i) criar e gerenciar sua conta; (ii) processar pagamentos e liberar downloads; (iii) prestar suporte; (iv) enviar comunicações essenciais (confirmações de pagamento, alterações no serviço); (v) cumprir obrigações legais e fiscais.</p>

        <h2 className="mb-2 mt-8 font-display text-xl font-semibold text-foreground">3. Compartilhamento</h2>
        <p className="mb-4">Compartilhamos dados apenas com prestadores essenciais para o funcionamento do serviço:</p>
        <ul className="mb-4 list-disc space-y-1 pl-6">
          <li><strong>Stripe</strong> — processamento de assinaturas recorrentes.</li>
          <li><strong>Mercado Pago</strong> — processamento de pagamentos via Pix.</li>
          <li><strong>Supabase</strong> — infraestrutura de banco de dados e autenticação.</li>
        </ul>
        <p className="mb-4">Nunca vendemos ou alugamos seus dados pessoais a terceiros.</p>

        <h2 className="mb-2 mt-8 font-display text-xl font-semibold text-foreground">4. Cookies</h2>
        <p className="mb-4">Utilizamos cookies essenciais para autenticação e funcionamento do carrinho. Ao continuar navegando, você concorda com o uso desses cookies. Você pode desabilitá-los nas configurações do seu navegador, ciente de que isso pode afetar o funcionamento do site.</p>

        <h2 className="mb-2 mt-8 font-display text-xl font-semibold text-foreground">5. Seus direitos (LGPD)</h2>
        <p className="mb-4">Como titular dos dados, você pode a qualquer momento solicitar: (i) confirmação da existência de tratamento; (ii) acesso aos dados; (iii) correção de dados incompletos ou desatualizados; (iv) anonimização, bloqueio ou eliminação; (v) portabilidade; (vi) revogação do consentimento; (vii) exclusão da conta.</p>
        <p className="mb-4">Para exercer seus direitos, envie um pedido através da nossa <a href="/suporte" className="text-primary underline">página de suporte</a>.</p>

        <h2 className="mb-2 mt-8 font-display text-xl font-semibold text-foreground">6. Retenção</h2>
        <p className="mb-4">Manteremos seus dados enquanto sua conta estiver ativa ou pelo tempo necessário para cumprir obrigações legais e fiscais (mínimo de 5 anos para dados de transações, conforme legislação brasileira).</p>

        <h2 className="mb-2 mt-8 font-display text-xl font-semibold text-foreground">7. Segurança</h2>
        <p className="mb-4">Adotamos medidas técnicas e administrativas para proteger seus dados: criptografia em trânsito (HTTPS), senhas hasheadas, controle de acesso por permissões (RLS) e monitoramento contínuo.</p>

        <h2 className="mb-2 mt-8 font-display text-xl font-semibold text-foreground">8. Contato do Encarregado (DPO)</h2>
        <p className="mb-4">Para dúvidas relacionadas ao tratamento dos seus dados, entre em contato pela nossa <a href="/suporte" className="text-primary underline">página de suporte</a>.</p>

        <h2 className="mb-2 mt-8 font-display text-xl font-semibold text-foreground">9. Alterações nesta política</h2>
        <p>Podemos atualizar esta política periodicamente. A data da última atualização estará sempre indicada no topo desta página. Alterações significativas serão comunicadas por e-mail ou aviso no site.</p>
      </article>
    </SiteLayout>
  );
}
