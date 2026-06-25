"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import {
  BellIcon,
  BoxesIcon,
  CheckCircle2Icon,
  InboxIcon,
  LayersIcon,
  PaletteIcon,
  PlusIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";

import { cn } from "@/common/utils/cn";
import { ThemeToggle } from "@/common/components/theme-toggle";
import { Button } from "@/common/components/ui/button";
import { Badge } from "@/common/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { Input } from "@/common/components/ui/input";
import { Textarea } from "@/common/components/ui/textarea";
import { Label } from "@/common/components/ui/label";
import { Checkbox } from "@/common/components/ui/checkbox";
import { Switch } from "@/common/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/common/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/common/components/ui/form";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/common/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/common/components/ui/alert-dialog";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/common/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/common/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/common/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/common/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/common/components/ui/avatar";
import { Separator } from "@/common/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/common/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/common/components/ui/accordion";
import { toast } from "sonner";
import { Skeleton } from "@/common/components/ui/skeleton";
import { Spinner } from "@/common/components/feedback/spinner";
import {
  EmptyState,
  EmptyStateAction,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/common/components/feedback/empty-state";
import { Boundary } from "@/common/components/feedback/boundary";
import { CardSkeleton } from "@/common/components/feedback/card-skeleton";
import { ListSkeleton } from "@/common/components/feedback/list-skeleton";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderRow,
  PageHeaderTitle,
} from "@/common/components/patterns/page-header";
import { StatCard } from "@/common/components/patterns/stat-card";
import { ConfirmAction } from "@/common/components/patterns/confirm-action";
import { AsyncSection } from "@/common/components/patterns/async-section";

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function createDelayedPromise<T>(value: T, ms: number) {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), ms);
  });
}

function AsyncBoundaryDemo({ attempt }: { attempt: number }) {
  const promise = React.useMemo(
    () => createDelayedPromise("Conteúdo carregado via Suspense.", 1500),
    [attempt],
  );
  const message = React.use(promise);
  return <p className="text-muted-foreground text-sm">{message}</p>;
}

function BoundarySuspenseDemo() {
  const [attempt, setAttempt] = React.useState(0);

  return (
    <div className="space-y-3">
      <Boundary key={attempt} fallback={<CardSkeleton />}>
        <AsyncBoundaryDemo attempt={attempt} />
      </Boundary>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setAttempt((a) => a + 1)}
      >
        Recarregar Suspense
      </Button>
    </div>
  );
}

function ErrorThrower({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Erro de demonstração — clique em tentar novamente.");
  }
  return (
    <p className="text-muted-foreground text-sm">
      Nenhum erro ativo. Dispare um erro abaixo.
    </p>
  );
}

function BoundaryErrorDemo() {
  const [shouldThrow, setShouldThrow] = React.useState(false);
  const [key, setKey] = React.useState(0);

  return (
    <div className="space-y-3">
      <Boundary
        key={key}
        fallback={<ListSkeleton count={2} />}
        errorFallback={({ reset }) => (
          <div className="border-destructive/30 bg-destructive/5 space-y-3 rounded-lg border p-4 text-center">
            <p className="text-sm font-medium">Falha ao carregar</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShouldThrow(false);
                setKey((k) => k + 1);
                reset();
              }}
            >
              Tentar novamente
            </Button>
          </div>
        )}
      >
        <ErrorThrower shouldThrow={shouldThrow} />
      </Boundary>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setShouldThrow(true)}
      >
        Disparar erro
      </Button>
    </div>
  );
}

function AsyncSectionDemo() {
  const [attempt, setAttempt] = React.useState(0);
  const [showEmpty, setShowEmpty] = React.useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowEmpty((v) => !v)}
        >
          {showEmpty ? "Mostrar conteúdo" : "Simular vazio"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAttempt((a) => a + 1)}
        >
          Recarregar
        </Button>
      </div>
      <AsyncSection
        key={attempt}
        fallback={<ListSkeleton count={3} />}
        isEmpty={showEmpty}
        empty={
          <EmptyState className="border-solid">
            <EmptyStateIcon>
              <InboxIcon />
            </EmptyStateIcon>
            <EmptyStateTitle>Nenhum registro</EmptyStateTitle>
            <EmptyStateDescription>
              AsyncSection renderiza empty quando isEmpty é true.
            </EmptyStateDescription>
          </EmptyState>
        }
      >
        <AsyncBoundaryDemo attempt={attempt} />
      </AsyncSection>
    </div>
  );
}

const formSchema = z.object({
  name: z.string().min(2, "Mínimo de 2 caracteres."),
  email: z.string().email("Email inválido."),
  role: z.string().min(1, "Selecione um cargo."),
  plan: z.enum(["free", "pro", "enterprise"], {
    message: "Escolha um plano.",
  }),
  bio: z.string().max(160, "Máximo de 160 caracteres.").optional(),
  notifications: z.boolean(),
  terms: z.boolean().refine((v) => v, { message: "Você precisa aceitar." }),
});

type FormValues = z.infer<typeof formSchema>;

function DemoForm() {
  const [submitted, setSubmitted] = React.useState<FormValues | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "",
      plan: "free",
      bio: "",
      notifications: true,
      terms: false,
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          setSubmitted(values);
          toast.success("Formulário enviado", {
            description: `${values.name} — ${values.email}`,
          });
        })}
        className="grid gap-5"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Ada Lovelace" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="voce@exemplo.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cargo</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um cargo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="dev">Desenvolvedor(a)</SelectItem>
                  <SelectItem value="design">Designer</SelectItem>
                  <SelectItem value="pm">Product Manager</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="plan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plano</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid-cols-3"
                >
                  {(["free", "pro", "enterprise"] as const).map((plan) => (
                    <Label
                      key={plan}
                      className="border-input has-data-[state=checked]:border-primary flex items-center gap-2 rounded-md border p-3 font-normal capitalize"
                    >
                      <RadioGroupItem value={plan} />
                      {plan}
                    </Label>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Conte um pouco sobre você..."
                  {...field}
                />
              </FormControl>
              <FormDescription>Opcional, até 160 caracteres.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notifications"
          render={({ field }) => (
            <FormItem className="border-border flex items-center justify-between rounded-md border p-3">
              <div className="space-y-0.5">
                <FormLabel>Notificações por email</FormLabel>
                <FormDescription>Receba novidades do produto.</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Aceito os termos de uso</FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-3">
          <Button type="submit">Enviar</Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              form.reset();
              setSubmitted(null);
            }}
          >
            Limpar
          </Button>
        </div>

        {submitted && (
          <div className="border-success/40 bg-success/10 flex items-start gap-2 rounded-md border p-3 text-sm">
            <CheckCircle2Icon className="text-success mt-0.5 size-4" />
            <div className="space-y-1">
              <p className="font-medium">Enviado com sucesso</p>
              <pre className="text-muted-foreground overflow-x-auto font-mono text-xs">
                {JSON.stringify(submitted, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </form>
    </Form>
  );
}

const architecture = [
  {
    icon: LayersIcon,
    title: "Arquitetura DDD-lite",
    description:
      "Cada feature em modules/<feature> com camadas domain, application, infrastructure e presentation, e dependência em sentido único.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Auth & DB plugáveis",
    description:
      "Ports & Adapters: a main é agnóstica de stack (só contratos). Você cria uma branch e implementa a stack desejada nos seams.",
  },
  {
    icon: PaletteIcon,
    title: "Design System",
    description:
      "Tokens semânticos em OKLCH, troca de paleta num único bloco, dark mode via next-themes e primitivos sobre Radix + Tailwind v4.",
  },
];

const buttonVariantsList = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
] as const;

const badgeVariantsList = [
  "default",
  "secondary",
  "outline",
  "success",
  "warning",
  "info",
  "destructive",
] as const;

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="border-border bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            <BoxesIcon className="text-primary size-5" />
            Boilerplate
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/preview">Preview</Link>
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" asChild>
                  <a
                    href="https://ui.shadcn.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Docs
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Referência dos primitivos</TooltipContent>
            </Tooltip>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-16 px-4 py-12">
        {/* Hero */}
        <section className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Next.js 16</Badge>
            <Badge variant="secondary">React 19</Badge>
            <Badge variant="secondary">Tailwind v4</Badge>
            <Badge variant="secondary">TypeScript</Badge>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Um boilerplate web pronto para escalar
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg text-pretty">
            Fundação opinativa com arquitetura DDD-lite, autenticação e banco
            plugáveis (Ports & Adapters) e um design system próprio sobre Radix
            + Tailwind. Esta página é também a galeria viva dos componentes
            base.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/preview">Ver preview</Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="#components">Ver componentes</a>
            </Button>
          </div>
        </section>

        {/* Arquitetura */}
        <Section
          id="arquitetura"
          title="Arquitetura"
          description="Os pilares que o boilerplate já entrega na main."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {architecture.map(({ icon: Icon, title, description }) => (
              <Card key={title}>
                <CardHeader>
                  <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-md">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="mt-3">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </Section>

        <div id="components" className="space-y-16">
          {/* Buttons */}
          <Section
            id="buttons"
            title="Button"
            description="Variantes e tamanhos via CVA. Suporta asChild (polimorfismo)."
          >
            <Card>
              <CardContent className="flex flex-col gap-6">
                <div className="flex flex-wrap items-center gap-3">
                  {buttonVariantsList.map((variant) => (
                    <Button key={variant} variant={variant}>
                      {variant}
                    </Button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button disabled>Disabled</Button>
                </div>
              </CardContent>
            </Card>
          </Section>

          {/* Badges */}
          <Section
            id="badges"
            title="Badge"
            description="Inclui os intents semânticos: success, warning e info."
          >
            <Card>
              <CardContent className="flex flex-wrap gap-3">
                {badgeVariantsList.map((variant) => (
                  <Badge key={variant} variant={variant}>
                    {variant}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          </Section>

          {/* Avatar & Separator */}
          <Section
            id="avatar"
            title="Avatar & Separator"
            description="Avatares com fallback e divisor horizontal/vertical."
          >
            <Card>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                  <Avatar>
                    <AvatarImage
                      src="https://api.dicebear.com/9.x/avataaars/svg?seed=Ada"
                      alt="Ada Lovelace"
                    />
                    <AvatarFallback>AL</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <Avatar className="size-10">
                    <AvatarFallback className="text-xs">+3</AvatarFallback>
                  </Avatar>
                  <div className="flex -space-x-2">
                    {["AL", "JD", "MK"].map((initials) => (
                      <Avatar key={initials} className="ring-background ring-2">
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="text-muted-foreground flex h-8 items-center gap-4 text-sm">
                  <span>Item A</span>
                  <Separator orientation="vertical" />
                  <span>Item B</span>
                  <Separator orientation="vertical" />
                  <span>Item C</span>
                </div>
              </CardContent>
            </Card>
          </Section>

          {/* Tabs & Accordion */}
          <Section
            id="tabs-accordion"
            title="Tabs & Accordion"
            description="Organização de conteúdo em abas e painéis expansíveis."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tabs</CardTitle>
                  <CardDescription>
                    Alternância entre views relacionadas.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="overview">
                    <TabsList className="w-full">
                      <TabsTrigger value="overview">Visão geral</TabsTrigger>
                      <TabsTrigger value="analytics">Analytics</TabsTrigger>
                      <TabsTrigger value="settings">Config</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview" className="mt-4 text-sm">
                      <p className="text-muted-foreground">
                        Resumo do projeto e métricas principais.
                      </p>
                    </TabsContent>
                    <TabsContent value="analytics" className="mt-4 text-sm">
                      <p className="text-muted-foreground">
                        Gráficos e dados de uso ao longo do tempo.
                      </p>
                    </TabsContent>
                    <TabsContent value="settings" className="mt-4 text-sm">
                      <p className="text-muted-foreground">
                        Preferências da conta e integrações.
                      </p>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Accordion</CardTitle>
                  <CardDescription>
                    Conteúdo colapsável para FAQs e detalhes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible defaultValue="item-1">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>
                        O que é este boilerplate?
                      </AccordionTrigger>
                      <AccordionContent>
                        Uma fundação Next.js com arquitetura DDD-lite, auth e DB
                        plugáveis, e um design system próprio.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger>
                        Como trocar a paleta de cores?
                      </AccordionTrigger>
                      <AccordionContent>
                        Edite o bloco &quot;PALETA DE CORES&quot; em{" "}
                        <code className="font-mono text-xs">globals.css</code>.
                        Todos os componentes herdam os tokens.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                      <AccordionTrigger>
                        Posso usar outra stack de auth/DB?
                      </AccordionTrigger>
                      <AccordionContent>
                        Sim. Crie uma branch a partir da main e implemente os
                        seams em infrastructure/ — ports e padrões já estão
                        definidos.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* Form */}
          <Section
            id="form"
            title="Formulário"
            description="react-hook-form + zod, com Input, Select, RadioGroup, Textarea, Switch e Checkbox. Validação e acessibilidade integradas."
          >
            <Card>
              <CardHeader>
                <CardTitle>Perfil</CardTitle>
                <CardDescription>
                  Exemplo funcional — tente enviar vazio para ver os erros.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DemoForm />
              </CardContent>
            </Card>
          </Section>

          {/* Overlays */}
          <Section
            id="overlays"
            title="Overlays"
            description="Dialog, AlertDialog, Sheet, Popover, Tooltip e DropdownMenu. Toasts ficam na seção Sonner."
          >
            <Card>
              <CardContent className="flex flex-wrap gap-3">
                {/* Dialog */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Dialog</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar perfil</DialogTitle>
                      <DialogDescription>
                        Faça alterações e salve quando terminar.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                      <Label htmlFor="dialog-name">Nome</Label>
                      <Input id="dialog-name" defaultValue="Ada Lovelace" />
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button>Salvar</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* AlertDialog */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">AlertDialog</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className={cn(
                          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                        )}
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Sheet */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline">Sheet</Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Painel lateral</SheetTitle>
                      <SheetDescription>
                        Ótimo para filtros e navegação mobile.
                      </SheetDescription>
                    </SheetHeader>
                    <SheetFooter>
                      <SheetClose asChild>
                        <Button>Fechar</Button>
                      </SheetClose>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>

                {/* Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">Popover</Button>
                  </PopoverTrigger>
                  <PopoverContent className="space-y-2">
                    <p className="text-sm font-medium">Dimensões</p>
                    <div className="grid gap-2">
                      <Label htmlFor="w">Largura</Label>
                      <Input id="w" defaultValue="100%" />
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Tooltip */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Tooltip</Button>
                  </TooltipTrigger>
                  <TooltipContent>Uma dica útil</TooltipContent>
                </Tooltip>

                {/* DropdownMenu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">Dropdown</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Perfil</DropdownMenuItem>
                    <DropdownMenuItem>Configurações</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          </Section>

          {/* Toast (Sonner) */}
          <Section
            id="toast"
            title="Toast (Sonner)"
            description="Notificações efêmeras integradas ao tema. O Toaster está no layout global."
          >
            <Card>
              <CardContent className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() =>
                    toast("Evento agendado", {
                      description: "Segunda-feira, 10:00",
                    })
                  }
                >
                  Default
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toast.success("Alterações salvas")}
                >
                  Success
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    toast.warning("Limite quase atingido", {
                      description: "80% do plano utilizado.",
                    })
                  }
                >
                  Warning
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    toast.info("Nova versão disponível", {
                      description: "Confira o changelog.",
                    })
                  }
                >
                  Info
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toast.error("Falha ao conectar")}
                >
                  Error
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    toast("Arquivo excluído", {
                      action: {
                        label: "Desfazer",
                        onClick: () => toast.success("Restaurado"),
                      },
                    })
                  }
                >
                  Com ação
                </Button>
              </CardContent>
            </Card>
          </Section>

          {/* Feedback */}
          <Section
            id="feedback"
            title="Feedback"
            description="Estados de carregamento, erro e vazio — camada feedback/ sobre os primitivos ui/."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Skeleton</CardTitle>
                  <CardDescription>
                    Primitivo em ui/ + composições CardSkeleton e ListSkeleton.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                  <ListSkeleton count={2} />
                </CardContent>
              </Card>

              <CardSkeleton />

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Spinner</CardTitle>
                  <CardDescription>
                    Indicador inline para botões e áreas pequenas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-6">
                  <Spinner size="sm" />
                  <Spinner />
                  <Spinner size="lg" />
                  <Button disabled>
                    <Spinner size="sm" className="text-primary-foreground" />
                    Salvando…
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">EmptyState</CardTitle>
                  <CardDescription>
                    Compound components para listas ou buscas sem resultados.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EmptyState>
                    <EmptyStateIcon>
                      <InboxIcon />
                    </EmptyStateIcon>
                    <EmptyStateTitle>Nenhum item encontrado</EmptyStateTitle>
                    <EmptyStateDescription>
                      Crie o primeiro registro para começar a usar o módulo.
                    </EmptyStateDescription>
                    <EmptyStateAction>
                      <Button size="sm">
                        <PlusIcon />
                        Criar item
                      </Button>
                    </EmptyStateAction>
                  </EmptyState>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Boundary — Suspense
                  </CardTitle>
                  <CardDescription>
                    Wrapper com fallback de loading (CardSkeleton).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BoundarySuspenseDemo />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Boundary — Erro</CardTitle>
                  <CardDescription>
                    Error Boundary com UI de retry customizada.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BoundaryErrorDemo />
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* Patterns */}
          <Section
            id="patterns"
            title="Patterns"
            description="Compostos de produto em patterns/ — montados sobre ui/ e feedback/."
          >
            <PageHeader separator className="pb-2">
              <PageHeaderRow>
                <PageHeaderContent>
                  <PageHeaderTitle>Dashboard</PageHeaderTitle>
                  <PageHeaderDescription>
                    Exemplo de PageHeader com ações à direita.
                  </PageHeaderDescription>
                </PageHeaderContent>
                <PageHeaderActions>
                  <Button variant="outline" size="sm">
                    Exportar
                  </Button>
                  <Button size="sm">Novo</Button>
                </PageHeaderActions>
              </PageHeaderRow>
            </PageHeader>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Usuários"
                value="1.284"
                delta={{ value: 12, trend: "up", label: "vs. mês anterior" }}
                icon={<UsersIcon />}
              />
              <StatCard
                label="Receita"
                value="R$ 48,2k"
                delta={{ value: 8, trend: "up", label: "vs. mês anterior" }}
              />
              <StatCard
                label="Churn"
                value="2,3%"
                delta={{ value: 0.4, trend: "down", label: "vs. mês anterior" }}
              />
              <StatCard
                label="Tickets abertos"
                value="17"
                description="3 urgentes"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">ConfirmAction</CardTitle>
                  <CardDescription>
                    Button + AlertDialog wired para ações destrutivas ou
                    confirmação async.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <ConfirmAction
                    trigger={
                      <Button variant="destructive">Excluir item</Button>
                    }
                    title="Excluir este item?"
                    description="Esta ação não pode ser desfeita."
                    confirmLabel="Excluir"
                    variant="destructive"
                    onConfirm={() => {
                      toast.success("Item excluído (demo)");
                    }}
                  />
                  <ConfirmAction
                    trigger={<Button variant="outline">Publicar</Button>}
                    title="Publicar alterações?"
                    description="O conteúdo ficará visível para todos."
                    confirmLabel="Publicar"
                    onConfirm={async () => {
                      await new Promise((r) => setTimeout(r, 800));
                      toast.success("Publicado");
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">AsyncSection</CardTitle>
                  <CardDescription>
                    Boundary + empty state num único wrapper.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AsyncSectionDemo />
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* Controles soltos */}
          <Section
            id="controls"
            title="Controles"
            description="Os primitivos de seleção isolados."
          >
            <Card>
              <CardHeader>
                <CardTitle>Preferências</CardTitle>
                <CardAction>
                  <Badge variant="info">demo</Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Checkbox id="c1" defaultChecked />
                  <Label htmlFor="c1">Lembrar de mim</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="s1" defaultChecked />
                  <Label htmlFor="s1">Modo compacto</Label>
                </div>
                <div className="space-y-2">
                  <Label>Tema preferido</Label>
                  <RadioGroup defaultValue="system" className="grid-cols-3">
                    {["claro", "escuro", "system"].map((v) => (
                      <Label
                        key={v}
                        className="flex items-center gap-2 font-normal capitalize"
                      >
                        <RadioGroupItem value={v} />
                        {v}
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sel">Idioma</Label>
                  <Select defaultValue="pt">
                    <SelectTrigger id="sel" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt">Português</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="gap-2 border-t">
                <BellIcon className="text-muted-foreground size-4" />
                <span className="text-muted-foreground text-sm">
                  As preferências são apenas demonstrativas.
                </span>
              </CardFooter>
            </Card>
          </Section>
        </div>
      </main>

      <footer className="border-border border-t">
        <div className="text-muted-foreground mx-auto flex max-w-5xl items-center justify-between px-4 py-6 text-sm">
          <span>Boilerplate Web</span>
          <span>Next.js + Tailwind + Radix</span>
        </div>
      </footer>
    </div>
  );
}
