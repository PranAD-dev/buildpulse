import { DollarSign, TrendingDown, AlertTriangle, Clock } from "lucide-react"

export function CostImpact() {
  return (
    <section className="py-20 px-4 bg-red-50">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium mb-4">
            <AlertTriangle className="w-4 h-4" />
            The Hidden Cost of Delays
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4 text-balance">
            Construction Delays Cost More Than You Think
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Every day of delay compounds costs across labor, equipment, financing, and opportunity. BuildPulse helps you
            catch problems early—before they become expensive.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card rounded-xl border border-red-200 p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-7 h-7 text-red-600" />
            </div>
            <p className="text-4xl font-bold text-red-600 mb-2">$15,000+</p>
            <p className="text-sm text-muted-foreground font-medium">Average Daily Delay Cost</p>
            <p className="text-xs text-muted-foreground mt-2">Labor standby, equipment rental, financing charges</p>
          </div>

          <div className="bg-card rounded-xl border border-red-200 p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-7 h-7 text-red-600" />
            </div>
            <p className="text-4xl font-bold text-red-600 mb-2">23 Days</p>
            <p className="text-sm text-muted-foreground font-medium">Average Project Delay</p>
            <p className="text-xs text-muted-foreground mt-2">Without real-time progress tracking</p>
          </div>

          <div className="bg-card rounded-xl border border-red-200 p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <TrendingDown className="w-7 h-7 text-red-600" />
            </div>
            <p className="text-4xl font-bold text-red-600 mb-2">$345,000</p>
            <p className="text-sm text-muted-foreground font-medium">Typical Delay Cost Impact</p>
            <p className="text-xs text-muted-foreground mt-2">Per project, on average</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-8 md:p-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-primary mb-4">What a Single Week of Delay Really Costs</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-xs font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Labor Costs: $42,000</p>
                    <p className="text-sm text-muted-foreground">Workers waiting on-site or reassigned</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-xs font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Equipment Rental: $18,500</p>
                    <p className="text-sm text-muted-foreground">Cranes, machinery sitting idle</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-xs font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Financing Charges: $12,000</p>
                    <p className="text-sm text-muted-foreground">Extended loan interest accrual</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-xs font-bold">4</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Lost Revenue: $35,000+</p>
                    <p className="text-sm text-muted-foreground">Delayed occupancy, missed lease starts</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
              <p className="text-sm font-medium text-primary mb-3">Weekly Delay Impact</p>
              <p className="text-5xl font-bold text-red-600 mb-4">$107,500</p>
              <div className="h-px bg-border my-4" />
              <p className="text-sm text-muted-foreground mb-4">
                BuildPulse users catch delays an average of{" "}
                <span className="font-semibold text-foreground">12 days earlier</span>, saving:
              </p>
              <p className="text-3xl font-bold text-emerald-600">$184,000</p>
              <p className="text-xs text-muted-foreground mt-1">Average savings per project</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
