
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "admins": {
                  Row: {
                    "created_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"categories": {
                  Row: {
                    "hint": string | null,"id": string,"name": string,"position": number,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "hint"?: string | null,"id"?: string,"name": string,"position"?: number,"slug": string
                  }
                  Update: {
                    "hint"?: string | null,"id"?: string,"name"?: string,"position"?: number,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"order_events": {
                  Row: {
                    "created_at": string,"id": number,"message": string,"order_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: never,"message": string,"order_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: never,"message"?: string,"order_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_events_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"order_items": {
                  Row: {
                    "check_status": Database["public"]['Enums']["item_check"],"created_at": string,"customer_choice": Database["public"]['Enums']["customer_choice"] | null,"id": string,"order_id": string,"product_id": string | null,"product_name": string,"quantity": number,"replacement_product_id": string | null,"unit_price": number
                  }
                  ComputedFields: never
                  Insert: {
                    "check_status"?: Database["public"]['Enums']["item_check"],"created_at"?: string,"customer_choice"?: Database["public"]['Enums']["customer_choice"] | null,"id"?: string,"order_id": string,"product_id"?: string | null,"product_name": string,"quantity": number,"replacement_product_id"?: string | null,"unit_price": number
                  }
                  Update: {
                    "check_status"?: Database["public"]['Enums']["item_check"],"created_at"?: string,"customer_choice"?: Database["public"]['Enums']["customer_choice"] | null,"id"?: string,"order_id"?: string,"product_id"?: string | null,"product_name"?: string,"quantity"?: number,"replacement_product_id"?: string | null,"unit_price"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_items_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "catalogue"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_replacement_product_id_fkey"
      columns: ["replacement_product_id"]
isOneToOne: false
      referencedRelation: "catalogue"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_replacement_product_id_fkey"
      columns: ["replacement_product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"orders": {
                  Row: {
                    "address_details": string,"code": string,"commune": string,"confirm_before": string,"created_at": string,"customer_name": string,"customer_phone": string,"delivery_fee": number | null,"id": string,"payment_method": Database["public"]['Enums']["payment_method"],"status": Database["public"]['Enums']["order_status"],"tracking_token": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address_details": string,"code"?: string,"commune": string,"confirm_before"?: string,"created_at"?: string,"customer_name": string,"customer_phone": string,"delivery_fee"?: number | null,"id"?: string,"payment_method"?: Database["public"]['Enums']["payment_method"],"status"?: Database["public"]['Enums']["order_status"],"tracking_token"?: string,"updated_at"?: string
                  }
                  Update: {
                    "address_details"?: string,"code"?: string,"commune"?: string,"confirm_before"?: string,"created_at"?: string,"customer_name"?: string,"customer_phone"?: string,"delivery_fee"?: number | null,"id"?: string,"payment_method"?: Database["public"]['Enums']["payment_method"],"status"?: Database["public"]['Enums']["order_status"],"tracking_token"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"products": {
                  Row: {
                    "brand": string | null,"category_id": string,"created_at": string,"description": string | null,"id": string,"images": (string)[],"is_published": boolean,"last_checked_at": string | null,"name": string,"old_price": number | null,"price": number,"slug": string,"status": Database["public"]['Enums']["product_status"],"supplier_id": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "brand"?: string | null,"category_id": string,"created_at"?: string,"description"?: string | null,"id"?: string,"images"?: (string)[],"is_published"?: boolean,"last_checked_at"?: string | null,"name": string,"old_price"?: number | null,"price": number,"slug": string,"status"?: Database["public"]['Enums']["product_status"],"supplier_id"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "brand"?: string | null,"category_id"?: string,"created_at"?: string,"description"?: string | null,"id"?: string,"images"?: (string)[],"is_published"?: boolean,"last_checked_at"?: string | null,"name"?: string,"old_price"?: number | null,"price"?: number,"slug"?: string,"status"?: Database["public"]['Enums']["product_status"],"supplier_id"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "products_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "products_supplier_id_fkey"
      columns: ["supplier_id"]
isOneToOne: false
      referencedRelation: "suppliers"
      referencedColumns: ["id"]
    }
                  ]
                },"stock_alerts": {
                  Row: {
                    "created_at": string,"id": string,"notified_at": string | null,"phone": string,"product_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"notified_at"?: string | null,"phone": string,"product_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"notified_at"?: string | null,"phone"?: string,"product_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "stock_alerts_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "catalogue"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stock_alerts_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"suppliers": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"notes": string | null,"whatsapp": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"notes"?: string | null,"whatsapp"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"notes"?: string | null,"whatsapp"?: string | null
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "catalogue": {
                  Row: {
                    "brand": string | null,"category_name": string | null,"category_slug": string | null,"created_at": string | null,"description": string | null,"id": string | null,"images": (string)[] | null,"name": string | null,"old_price": number | null,"price": number | null,"slug": string | null,"status": Database["public"]['Enums']["product_status"] | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "create_order":
{ Args: { "p_address_details": string,"p_commune": string,"p_customer_name": string,"p_customer_phone": string,"p_items": Json,"p_payment_method": Database["public"]['Enums']["payment_method"] }; Returns: Json
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           }
          }
          Enums: {
            "customer_choice": "replace"|"remove"|"cancel","item_check": "pending"|"available"|"unavailable","order_status": "received"|"checking"|"action_required"|"confirmed"|"shipping"|"delivered"|"cancelled","payment_method": "cash"|"wave"|"orange_money","product_status": "available"|"on_order"|"sold_out"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "customer_choice": ["replace", "remove", "cancel"],"item_check": ["pending", "available", "unavailable"],"order_status": ["received", "checking", "action_required", "confirmed", "shipping", "delivered", "cancelled"],"payment_method": ["cash", "wave", "orange_money"],"product_status": ["available", "on_order", "sold_out"]
          }
        }
} as const
