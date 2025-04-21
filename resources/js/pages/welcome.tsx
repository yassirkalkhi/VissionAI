"use client"
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  FileText,
  Image,
  Layers,
  Lightbulb,
  Scan,
  Sparkles,
  Upload,
  Zap,
  CheckCircle,
  Star,
  MessageSquare,
} from "lucide-react"
import { motion } from "framer-motion"
import { useLanguage } from "@/contexts/LanguageContext"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { router } from "@inertiajs/react"

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export default function Dashboard() {
  const { t } = useLanguage()
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03] z-0">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </div>

      <div className="relative px-4 md:px-8 lg:px-16 mx-auto max-w-7xl">
        {/* Hero Section */}
        <motion.section className="relative py-20 md:py-32" initial="hidden" animate="visible" variants={fadeIn}>
          <motion.div
            className="flex flex-col items-center justify-center text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-4" variant="outline">
              <Sparkles className="mr-1 h-3 w-3" />
              {t.imageAnalysis}
            </Badge>
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
              {t.welcome}
            </h1>
            <p className="mb-8 max-w-3xl text-xl text-muted-foreground">
              {t.welcomeMessage}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" onClick={() => router.visit('/chat')}>
                {t.gettingStarted}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.visit('/docs')}>
                <BookOpen className="mr-2 h-4 w-4" />
                {t.keyboardShortcuts}
              </Button>
            </div>
          </motion.div>
        </motion.section>

        {/* Key Features Section */}
        <motion.section
          className="py-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeIn}
        >
          <div className="mb-12 text-center">
            <h2 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">{t.tips}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t.codeSupport}
            </p>
          </div>
          <motion.div
            className="grid gap-6 md:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div variants={fadeIn} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
              <Card className="h-full transition-all duration-200 hover:shadow-md">
                <CardHeader>
                  <Image className="mb-2 h-6 w-6 text-primary" />
                  <CardTitle>{t.imageAnalysis}</CardTitle>
                  <CardDescription>
                    {t.extractingText}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="ml-6 list-disc text-sm text-muted-foreground space-y-2">
                    <li>{t.imageAnalysis}</li>
                    <li>{t.textExtracted}</li>
                    <li>{t.extractingText}</li>
                    <li>{t.maxImages}</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeIn} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
              <Card className="h-full transition-all duration-200 hover:shadow-md">
                <CardHeader>
                  <FileText className="mb-2 h-6 w-6 text-primary" />
                  <CardTitle>{t.extractingText}</CardTitle>
                  <CardDescription>{t.textExtracted}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="ml-6 list-disc text-sm text-muted-foreground space-y-2">
                    <li>{t.extractingText}</li>
                    <li>{t.supportedFormats}</li>
                    <li>{t.textExtracted}</li>
                    <li>{t.extractingText}</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeIn} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
              <Card className="h-full transition-all duration-200 hover:shadow-md">
                <CardHeader>
                  <Lightbulb className="mb-2 h-6 w-6 text-primary" />
                  <CardTitle>{t.codeSnippet}</CardTitle>
                  <CardDescription>{t.codeSupport}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="ml-6 list-disc text-sm text-muted-foreground space-y-2">
                    <li>{t.copyCode}</li>
                    <li>{t.codeSupport}</li>
                    <li>{t.uploadImage}</li>
                    <li>{t.maxImages}</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* How It Works Section */}
        <motion.section
          className="py-20 rounded-lg bg-muted/50"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeIn}
        >
          <div className="mb-12 text-center">
            <h2 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">{t.gettingStarted}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t.welcomeMessage}
            </p>
          </div>
          <motion.div
            className="grid gap-8 md:grid-cols-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div
              className="flex flex-col items-center text-center"
              variants={fadeIn}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Upload className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-bold">1. {t.uploadImage}</h3>
              <p className="text-sm text-muted-foreground">
                {t.imageUploadTips}
              </p>
            </motion.div>

            <motion.div
              className="flex flex-col items-center text-center"
              variants={fadeIn}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Scan className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-bold">2. Process</h3>
              <p className="text-sm text-muted-foreground">
                Our AI models analyze the content using advanced computer vision techniques
              </p>
            </motion.div>

            <motion.div
              className="flex flex-col items-center text-center"
              variants={fadeIn}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Layers className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-bold">3. Extract</h3>
              <p className="text-sm text-muted-foreground">
                The system extracts objects, text, and contextual information
              </p>
            </motion.div>

            <motion.div
              className="flex flex-col items-center text-center"
              variants={fadeIn}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-bold">4. Utilize</h3>
              <p className="text-sm text-muted-foreground">
                Access structured data and insights through our dashboard or API responses
              </p>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Use Cases Section */}
        <motion.section
          className="py-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeIn}
        >
          <div className="mb-12 text-center">
            <h2 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">Use Cases</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover how our platform can transform various industries and workflows
            </p>
          </div>

          <Tabs defaultValue="enterprise" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="enterprise">Enterprise</TabsTrigger>
              <TabsTrigger value="healthcare">Healthcare</TabsTrigger>
              <TabsTrigger value="ecommerce">E-Commerce</TabsTrigger>
              <TabsTrigger value="legal">Legal</TabsTrigger>
            </TabsList>

            <TabsContent value="enterprise" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Enterprise Document Management</CardTitle>
                  <CardDescription>Streamline document processing and information extraction</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h4 className="mb-2 text-lg font-semibold">Key Benefits</h4>
                      <ul className="ml-6 list-disc text-sm text-muted-foreground space-y-2">
                        <li>Automate data entry from invoices and receipts</li>
                        <li>Extract key information from contracts and agreements</li>
                        <li>Organize and categorize visual assets</li>
                        <li>Enable searchable archives of scanned documents</li>
                      </ul>
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                      <div className="mb-4 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">Success Story</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        A Fortune 500 company reduced document processing time by 78% and improved data accuracy by 95%
                        after implementing our solution for invoice processing.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="healthcare" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Healthcare Image Analysis</CardTitle>
                  <CardDescription>Support medical professionals with AI-assisted image interpretation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h4 className="mb-2 text-lg font-semibold">Key Benefits</h4>
                      <ul className="ml-6 list-disc text-sm text-muted-foreground space-y-2">
                        <li>Assist in analyzing medical imaging</li>
                        <li>Extract data from patient records and forms</li>
                        <li>Digitize handwritten medical notes</li>
                        <li>Organize and categorize medical documentation</li>
                      </ul>
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                      <div className="mb-4 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">Success Story</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        A regional hospital network improved patient record processing efficiency by 65% and reduced
                        administrative costs by implementing our text extraction solution.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ecommerce" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>E-Commerce Visual Search</CardTitle>
                  <CardDescription>Enhance product discovery and catalog management</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h4 className="mb-2 text-lg font-semibold">Key Benefits</h4>
                      <ul className="ml-6 list-disc text-sm text-muted-foreground space-y-2">
                        <li>Enable visual search functionality for customers</li>
                        <li>Automatically tag and categorize product images</li>
                        <li>Generate SEO-friendly product descriptions</li>
                        <li>Improve accessibility with image descriptions</li>
                      </ul>
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                      <div className="mb-4 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">Success Story</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        An online retailer saw a 32% increase in conversion rates after implementing our visual search
                        and product description generation capabilities.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="legal" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Legal Document Analysis</CardTitle>
                  <CardDescription>Streamline contract review and document processing</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h4 className="mb-2 text-lg font-semibold">Key Benefits</h4>
                      <ul className="ml-6 list-disc text-sm text-muted-foreground space-y-2">
                        <li>Extract key clauses and terms from contracts</li>
                        <li>Digitize and index case files and evidence</li>
                        <li>Analyze and categorize legal documents</li>
                        <li>Enable searchable archives of legal precedents</li>
                      </ul>
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                      <div className="mb-4 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">Success Story</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        A law firm reduced contract review time by 60% and improved accuracy by implementing our
                        document analysis solution for due diligence processes.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.section>

        {/* Testimonials Section */}
        <motion.section
          className="py-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeIn}
        >
          <div className="mb-12 text-center">
            <h2 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">What Our Clients Say</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Trusted by leading companies across various industries
            </p>
          </div>

          <motion.div
            className="grid gap-6 md:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div variants={fadeIn} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
              <Card className="h-full transition-all duration-200 hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src="/placeholder.svg?height=40&width=40" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">John Doe</CardTitle>
                      <CardDescription>CTO, TechCorp</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground italic">
                    "VisionAI has transformed how we process our documentation. The accuracy of the text extraction is
                    remarkable, and the image recognition capabilities have opened new possibilities for our product
                    catalog management."
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeIn} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
              <Card className="h-full transition-all duration-200 hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src="/placeholder.svg?height=40&width=40" />
                      <AvatarFallback>SJ</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">Sarah Johnson</CardTitle>
                      <CardDescription>Head of Operations, MediHealth</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground italic">
                    "The implementation of VisionAI in our healthcare facility has significantly reduced administrative
                    overhead. Patient records are now processed in a fraction of the time, allowing our staff to focus
                    on patient care."
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeIn} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
              <Card className="h-full transition-all duration-200 hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src="/placeholder.svg?height=40&width=40" />
                      <AvatarFallback>RM</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">Robert Martinez</CardTitle>
                      <CardDescription>Digital Director, ShopEasy</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground italic">
                    "Our e-commerce platform has seen a dramatic improvement in user engagement since implementing
                    VisionAI's visual search capabilities. Product discovery is more intuitive, and our conversion rates
                    have increased significantly."
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Pricing Section */}
        <motion.section
          className="py-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeIn}
        >
          <div className="mb-12 text-center">
            <h2 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">Pricing Plans</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Choose the perfect plan for your needs</p>
          </div>

          <motion.div
            className="grid gap-6 md:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div variants={fadeIn} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
              <Card className="h-full transition-all duration-200 hover:shadow-md relative overflow-hidden" onClick={() => router.visit('/plans')}>
                <div className="absolute top-0 left-0 w-full h-1 bg-muted-foreground/20"></div>
                <CardHeader>
                  <CardTitle>Starter</CardTitle>
                  <CardDescription>Perfect for individuals and small projects</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$29</span>
                    <span className="text-muted-foreground ml-1">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>500 image analyses per month</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>Basic text extraction</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>Standard image recognition</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>Email support</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Get Started</Button>
                </CardFooter>
              </Card>
            </motion.div>

            <motion.div variants={fadeIn} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
              <Card className="h-full transition-all duration-200 hover:shadow-md relative overflow-hidden border-primary/50" onClick={() => router.visit('/docs')}>
                <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                <div className="absolute top-6 right-6">
                  <Badge>Popular</Badge>
                </div>
                <CardHeader>
                  <CardTitle>Professional</CardTitle>
                  <CardDescription>Ideal for growing businesses and teams</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$99</span>
                    <span className="text-muted-foreground ml-1">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>2,500 image analyses per month</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>Advanced text extraction</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>Enhanced image recognition</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>Priority email & chat support</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>API access</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Get Started</Button>
                </CardFooter>
              </Card>
            </motion.div>

            <motion.div variants={fadeIn} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
              <Card className="h-full transition-all duration-200 hover:shadow-md relative overflow-hidden" onClick={() => router.visit('/docs')}>
                <div className="absolute top-0 left-0 w-full h-1 bg-muted-foreground/20"></div>
                <CardHeader>
                  <CardTitle>Enterprise</CardTitle>
                  <CardDescription>Custom solutions for large organizations</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">Custom</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>Unlimited image analyses</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>Premium text extraction</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>Custom AI model training</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>24/7 dedicated support</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>Advanced API & integration</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span>SLA guarantees</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Contact Sales
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* FAQ Section */}
        <motion.section
          className="py-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeIn}
        >
          <div className="mb-12 text-center">
            <h2 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">Frequently Asked Questions</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions about our platform
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">What types of images can be processed?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our platform supports a wide range of image formats including JPEG, PNG, TIFF, BMP, and WebP. We can
                  process photographs, scanned documents, diagrams, charts, and more. The system is designed to handle
                  various image qualities, though higher resolution images typically yield better results.
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">How accurate is the text extraction?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our text extraction technology achieves over 98% accuracy on clear, typed documents and around 90% on
                  handwritten text, depending on legibility. We continuously train our models on diverse datasets to
                  improve accuracy across different languages, fonts, and writing styles.
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Is my data secure?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Absolutely. We employ industry-standard encryption for all data in transit and at rest. Your images
                  and documents are processed in secure environments, and we offer data retention controls to meet your
                  compliance requirements. We are GDPR compliant and can sign custom DPAs for enterprise clients.
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Can I integrate with my existing systems?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, our platform offers comprehensive API access and pre-built integrations with popular services
                  like Salesforce, SharePoint, Google Workspace, and more. Our developer documentation provides detailed
                  guides for custom integrations, and our Professional and Enterprise plans include integration support.
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">What languages are supported?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our platform currently supports text extraction in over 50 languages, including English, Spanish,
                  French, German, Chinese, Japanese, Arabic, and Russian. Image recognition capabilities work across all
                  visual content regardless of language, and we're continuously adding support for additional languages.
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">How can I get started?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Getting started is easy! Simply sign up for a free trial account, which includes 100 image analyses to
                  test our platform. No credit card is required for the trial. Once you're ready to scale, choose the
                  plan that best fits your needs or contact our sales team for a custom enterprise solution.
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Technology Section */}
        <motion.section
          className="py-20 rounded-lg bg-muted/50"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeIn}
        >
          <div className="mb-12 text-center">
            <h2 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">Our Technology</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powered by cutting-edge AI models and computer vision technology
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle>Advanced AI Models</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Our platform leverages state-of-the-art deep learning models trained on diverse datasets to deliver
                  exceptional accuracy and performance.
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span>Transformer-based architectures for superior text understanding</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span>Convolutional neural networks for image feature extraction</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span>Continuous model improvements through active learning</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Scan className="h-5 w-5 text-primary" />
                  <CardTitle>Computer Vision Excellence</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Our computer vision technology enables precise object detection, scene understanding, and visual
                  content analysis.
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span>Multi-scale object detection for varying image sizes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span>Instance segmentation for precise object boundaries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span>Scene graph generation for contextual understanding</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          className="py-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeIn}
        >
          <Card className="border bg-card overflow-hidden relative">
            <CardContent className="p-8 md:p-12">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Visual Data?</h2>
                <p className="text-muted-foreground text-lg mb-8">
                  Join thousands of businesses that are already leveraging our AI-powered platform to extract valuable
                  insights from their images and documents.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button size="lg">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Schedule Demo
                  </Button>
                </div>
                <div className="mt-8 flex items-center justify-center gap-8">
                  <div className="flex -space-x-2">
                    {[...Array(4)].map((_, i) => (
                      <Avatar key={i} className="border-2 border-background w-8 h-8">
                        <AvatarImage src={`/placeholder.svg?height=32&width=32`} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {String.fromCharCode(65 + i)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs border-2 border-background">
                      +2K
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">Trusted by 2,000+ companies worldwide</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </div>
  )
}

